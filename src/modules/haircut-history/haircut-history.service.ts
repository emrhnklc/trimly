import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpsertHaircutRecordDto } from './dto/upsert-haircut-record.dto';

@Injectable()
export class HaircutHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertForAppointment(
    barbershopId: string,
    appointmentId: string,
    userId: string,
    dto: UpsertHaircutRecordDto,
  ) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, barbershopId },
      select: {
        id: true,
        status: true,
        businessMember: { select: { userId: true } },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Randevu bulunamadı.');
    }

    if (appointment.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Tıraş kaydı yalnız tamamlanmış randevuya eklenebilir.',
      );
    }

    const membership = await this.prisma.businessMember.findUnique({
      where: { userId_barbershopId: { userId, barbershopId } },
      select: { id: true, role: true },
    });
    const canManageRecord =
      membership?.role === 'OWNER' ||
      membership?.role === 'MANAGER' ||
      appointment.businessMember.userId === userId;

    if (!canManageRecord || !membership) {
      throw new ForbiddenException('Bu tıraş kaydını düzenleme yetkin yok.');
    }

    return this.prisma.haircutRecord.upsert({
      where: { appointmentId: appointment.id },
      create: {
        appointmentId: appointment.id,
        createdByMemberId: membership.id,
        styleName: dto.styleName?.trim(),
        notes: dto.notes?.trim(),
      },
      update: {
        styleName: dto.styleName?.trim(),
        notes: dto.notes?.trim(),
      },
    });
  }

  findForCustomer(customerId: string) {
    return this.prisma.haircutRecord.findMany({
      where: {
        appointment: {
          customerId,
        },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        styleName: true,
        notes: true,
        createdAt: true,
        photos: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, storageKey: true, sortOrder: true },
        },
        appointment: {
          select: {
            id: true,
            serviceId: true,
            serviceNameSnapshot: true,
            priceSnapshot: true,
            durationMinutes: true,
            startsAt: true,
            barbershop: {
              select: { id: true, name: true, slug: true },
            },
            businessMember: {
              select: {
                id: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    profileImageUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}
