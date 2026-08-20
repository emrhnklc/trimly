import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  UpdateWorkingHoursDto,
  WorkingHoursItemDto,
} from './dto/update-working-hours.dto';
import { UpdateMemberWorkingHoursDto } from './dto/update-member-working-hours.dto';
import { CreateMemberScheduleBlockDto } from './dto/create-member-schedule-block.dto';

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  findWorkingHours(barbershopId: string) {
    return this.prisma.workingHours.findMany({
      where: { barbershopId },
      orderBy: { weekday: 'asc' },
      select: {
        weekday: true,
        startTime: true,
        endTime: true,
      },
    });
  }

  async replaceWorkingHours(barbershopId: string, dto: UpdateWorkingHoursDto) {
    this.validateWorkingHours(dto.hours);

    await this.prisma.$transaction([
      this.prisma.workingHours.deleteMany({ where: { barbershopId } }),
      this.prisma.workingHours.createMany({
        data: dto.hours.map((hour) => ({
          barbershopId,
          weekday: hour.weekday,
          startTime: hour.startTime,
          endTime: hour.endTime,
        })),
      }),
    ]);

    return this.findWorkingHours(barbershopId);
  }

  async findMemberWorkingHours(barbershopId: string, memberId: string) {
    await this.ensureMemberBelongsToBarbershop(barbershopId, memberId);

    return this.prisma.memberWorkingHours.findMany({
      where: { businessMemberId: memberId },
      orderBy: { weekday: 'asc' },
      select: {
        weekday: true,
        startTime: true,
        endTime: true,
      },
    });
  }

  async replaceMemberWorkingHours(
    barbershopId: string,
    memberId: string,
    dto: UpdateMemberWorkingHoursDto,
  ) {
    await this.ensureMemberBelongsToBarbershop(barbershopId, memberId);
    this.validateWorkingHours(dto.hours);

    await this.prisma.$transaction([
      this.prisma.memberWorkingHours.deleteMany({
        where: { businessMemberId: memberId },
      }),
      this.prisma.memberWorkingHours.createMany({
        data: dto.hours.map((hour) => ({
          businessMemberId: memberId,
          weekday: hour.weekday,
          startTime: hour.startTime,
          endTime: hour.endTime,
        })),
      }),
    ]);

    return this.findMemberWorkingHours(barbershopId, memberId);
  }

  async findUpcomingScheduleBlocks(barbershopId: string, memberId: string) {
    await this.ensureMemberBelongsToBarbershop(barbershopId, memberId);

    return this.prisma.memberScheduleBlock.findMany({
      where: {
        businessMemberId: memberId,
        endsAt: { gte: new Date() },
      },
      orderBy: { startsAt: 'asc' },
    });
  }

  async createMemberScheduleBlock(
    barbershopId: string,
    memberId: string,
    dto: CreateMemberScheduleBlockDto,
  ) {
    await this.ensureMemberBelongsToBarbershop(barbershopId, memberId);

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (startsAt >= endsAt) {
      throw new BadRequestException(
        'Blok bitişi başlangıç zamanından sonra olmalı.',
      );
    }

    return this.prisma.memberScheduleBlock.create({
      data: {
        businessMemberId: memberId,
        type: dto.type,
        startsAt,
        endsAt,
        note: dto.note?.trim(),
      },
    });
  }

  async removeMemberScheduleBlock(
    barbershopId: string,
    memberId: string,
    blockId: string,
  ) {
    await this.ensureMemberBelongsToBarbershop(barbershopId, memberId);

    const deleted = await this.prisma.memberScheduleBlock.deleteMany({
      where: { id: blockId, businessMemberId: memberId },
    });

    if (deleted.count === 0) {
      throw new NotFoundException('Mola veya izin bloğu bulunamadı.');
    }

    return { success: true };
  }

  private validateWorkingHours(hours: WorkingHoursItemDto[]) {
    const weekdays = new Set(hours.map((hour) => hour.weekday));

    if (weekdays.size !== hours.length) {
      throw new BadRequestException('Bir gün yalnız bir kez tanımlanabilir.');
    }

    for (const hour of hours) {
      if (this.toMinutes(hour.startTime) >= this.toMinutes(hour.endTime)) {
        throw new BadRequestException(
          'Bitiş saati başlangıç saatinden sonra olmalı.',
        );
      }
    }
  }

  private toMinutes(time: string) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private async ensureMemberBelongsToBarbershop(
    barbershopId: string,
    memberId: string,
  ) {
    const member = await this.prisma.businessMember.findFirst({
      where: { id: memberId, barbershopId },
      select: { id: true },
    });

    if (!member) {
      throw new BadRequestException('Çalışan bu işletmeye ait değil.');
    }
  }
}
