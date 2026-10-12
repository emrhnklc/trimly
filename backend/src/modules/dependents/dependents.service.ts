import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AppointmentStatus,
  DependentRelationship,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateDependentProfileDto } from './dto/create-dependent-profile.dto';
import { UpdateDependentProfileDto } from './dto/update-dependent-profile.dto';

const dependentProfileSelect = {
  id: true,
  firstName: true,
  lastName: true,
  relationship: true,
  relationshipLabel: true,
  birthDate: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DependentProfileSelect;

@Injectable()
export class DependentsService {
  constructor(private readonly prisma: PrismaService) {}

  list(ownerId: string) {
    return this.prisma.dependentProfile.findMany({
      where: { ownerId, archivedAt: null },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      select: dependentProfileSelect,
    });
  }

  async findOne(ownerId: string, dependentId: string) {
    const dependent = await this.prisma.dependentProfile.findFirst({
      where: { id: dependentId, ownerId, archivedAt: null },
      select: dependentProfileSelect,
    });
    if (!dependent) throw new NotFoundException('Yakın profili bulunamadı.');
    return dependent;
  }

  async create(ownerId: string, dto: CreateDependentProfileDto) {
    const activeCount = await this.prisma.dependentProfile.count({
      where: { ownerId, archivedAt: null },
    });
    if (activeCount >= 10) {
      throw new ConflictException(
        'En fazla 10 aktif yakın profili ekleyebilirsin.',
      );
    }

    const birthDate = this.parseBirthDate(dto.birthDate);
    const relationshipLabel = this.resolveRelationshipLabel(
      dto.relationship,
      dto.relationshipLabel,
    );
    return this.prisma.dependentProfile.create({
      data: {
        ownerId,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        relationship: dto.relationship,
        relationshipLabel,
        birthDate,
        notes: dto.notes?.trim() || null,
      },
      select: dependentProfileSelect,
    });
  }

  async update(
    ownerId: string,
    dependentId: string,
    dto: UpdateDependentProfileDto,
  ) {
    const dependent = await this.findOne(ownerId, dependentId);
    const relationship = dto.relationship ?? dependent.relationship;
    const relationshipLabel = this.resolveRelationshipLabel(
      relationship,
      dto.relationshipLabel ?? dependent.relationshipLabel ?? undefined,
    );
    return this.prisma.dependentProfile.update({
      where: { id: dependentId },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName.trim() }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName.trim() }),
        ...(dto.relationship !== undefined && {
          relationship: dto.relationship,
        }),
        relationshipLabel,
        ...(dto.birthDate !== undefined && {
          birthDate: this.parseBirthDate(dto.birthDate),
        }),
        ...(dto.notes !== undefined && { notes: dto.notes.trim() || null }),
      },
      select: dependentProfileSelect,
    });
  }

  async remove(ownerId: string, dependentId: string) {
    await this.findOne(ownerId, dependentId);
    const activeAppointmentCount = await this.prisma.appointment.count({
      where: {
        dependentProfileId: dependentId,
        status: {
          in: [AppointmentStatus.CONFIRMED, AppointmentStatus.ARRIVED],
        },
      },
    });
    if (activeAppointmentCount > 0) {
      throw new BadRequestException(
        'Aktif veya yaklaşan randevusu bulunan yakın profili kaldırılamaz.',
      );
    }

    const appointmentCount = await this.prisma.appointment.count({
      where: { dependentProfileId: dependentId },
    });
    if (appointmentCount > 0) {
      await this.prisma.dependentProfile.update({
        where: { id: dependentId },
        data: { archivedAt: new Date() },
      });
    } else {
      await this.prisma.dependentProfile.delete({ where: { id: dependentId } });
    }
    return { deleted: true };
  }

  private parseBirthDate(value: string) {
    const [year, month, day] = value.split('-').map(Number);
    const birthDate = new Date(Date.UTC(year, month - 1, day));
    const now = new Date();
    const oldestAllowed = new Date(
      Date.UTC(now.getUTCFullYear() - 120, now.getUTCMonth(), now.getUTCDate()),
    );
    if (
      Number.isNaN(birthDate.getTime()) ||
      birthDate.getUTCFullYear() !== year ||
      birthDate.getUTCMonth() !== month - 1 ||
      birthDate.getUTCDate() !== day ||
      birthDate > now ||
      birthDate < oldestAllowed
    ) {
      throw new BadRequestException('Geçerli bir doğum tarihi girilmelidir.');
    }
    return birthDate;
  }

  private resolveRelationshipLabel(
    relationship: DependentRelationship,
    value?: string,
  ) {
    if (relationship !== DependentRelationship.DEPENDENT) return null;
    const relationshipLabel = value?.trim();
    if (!relationshipLabel || relationshipLabel.length < 2) {
      throw new BadRequestException(
        'Diğer yakınlık türü için yakınlık adı girilmelidir.',
      );
    }
    return relationshipLabel;
  }
}
