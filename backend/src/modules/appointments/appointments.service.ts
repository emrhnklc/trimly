import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DateTime } from 'luxon';
import { AvailabilityService } from '../availability/availability.service';
import { PrismaService } from '../../database/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly availabilityService: AvailabilityService,
  ) {}

  async create(
    barbershopId: string,
    customerId: string,
    dto: CreateAppointmentDto,
  ) {
    const barbershop = await this.prisma.barbershop.findUnique({
      where: { id: barbershopId },
      select: { timezone: true },
    });

    if (!barbershop) {
      throw new NotFoundException('İşletme bulunamadı.');
    }

    const requestedStart = DateTime.fromISO(dto.startsAt, { setZone: true });
    if (!requestedStart.isValid) {
      throw new BadRequestException(
        'Geçerli bir başlangıç zamanı gönderilmelidir.',
      );
    }

    const localDate = requestedStart.setZone(barbershop.timezone).toISODate();
    if (!localDate) {
      throw new BadRequestException(
        'Geçerli bir başlangıç zamanı gönderilmelidir.',
      );
    }

    const availability = await this.availabilityService.findAvailableSlots(
      barbershopId,
      {
        memberId: dto.memberId,
        serviceId: dto.serviceId,
        date: localDate,
      },
    );
    const selectedSlot = availability.slots.find(
      (slot) =>
        DateTime.fromISO(slot.startsAt).toMillis() ===
        requestedStart.toMillis(),
    );

    if (!selectedSlot) {
      throw new ConflictException('Seçilen saat artık uygun değil.');
    }

    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, barbershopId, isActive: true },
      select: {
        id: true,
        name: true,
        price: true,
        durationMinutes: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Hizmet bulunamadı.');
    }

    try {
      return await this.prisma.appointment.create({
        data: {
          barbershopId,
          customerId,
          businessMemberId: dto.memberId,
          serviceId: service.id,
          serviceNameSnapshot: service.name,
          priceSnapshot: service.price,
          durationMinutes: service.durationMinutes,
          startsAt: new Date(selectedSlot.startsAt),
          endsAt: new Date(selectedSlot.endsAt),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2039'
      ) {
        throw new ConflictException(
          'Bu saat az önce başka biri tarafından alındı.',
        );
      }

      throw error;
    }
  }

  findForCustomer(customerId: string) {
    return this.prisma.appointment.findMany({
      where: { customerId },
      orderBy: { startsAt: 'desc' },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        status: true,
        serviceNameSnapshot: true,
        priceSnapshot: true,
        durationMinutes: true,
        cancelledAt: true,
        completedAt: true,
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
    });
  }

  async cancelForCustomer(appointmentId: string, customerId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        customerId: true,
        status: true,
        startsAt: true,
        barbershop: {
          select: {
            bookingSettings: {
              select: {
                customerCancellationEnabled: true,
                cancellationNoticeMinutes: true,
              },
            },
          },
        },
      },
    });

    if (!appointment || appointment.customerId !== customerId) {
      throw new NotFoundException('Randevu bulunamadı.');
    }

    if (appointment.status !== 'CONFIRMED') {
      throw new BadRequestException('Bu randevu iptal edilemez.');
    }

    const cancellationSettings = appointment.barbershop.bookingSettings ?? {
      customerCancellationEnabled: true,
      cancellationNoticeMinutes: 120,
    };

    if (!cancellationSettings.customerCancellationEnabled) {
      throw new BadRequestException(
        'Bu işletme müşteri tarafından iptale izin vermiyor.',
      );
    }

    const cancellationDeadline = new Date(
      appointment.startsAt.getTime() -
        cancellationSettings.cancellationNoticeMinutes * 60 * 1000,
    );
    if (new Date() >= cancellationDeadline) {
      throw new BadRequestException(
        `Bu randevu en az ${cancellationSettings.cancellationNoticeMinutes} dakika önceden iptal edilebilir.`,
      );
    }

    return this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });
  }

  findForBarbershop(barbershopId: string) {
    return this.prisma.appointment.findMany({
      where: { barbershopId },
      orderBy: { startsAt: 'desc' },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        status: true,
        serviceNameSnapshot: true,
        priceSnapshot: true,
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        businessMember: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  async findNextForCurrentMember(barbershopId: string, userId: string) {
    const membership = await this.prisma.businessMember.findUnique({
      where: { userId_barbershopId: { userId, barbershopId } },
      select: { id: true, isActive: true },
    });

    if (!membership?.isActive) {
      throw new ForbiddenException('Bu işletmenin aktif çalışanı değilsin.');
    }

    const appointment = await this.prisma.appointment.findFirst({
      where: {
        barbershopId,
        businessMemberId: membership.id,
        status: 'CONFIRMED',
        startsAt: { gte: new Date() },
      },
      orderBy: { startsAt: 'asc' },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        serviceNameSnapshot: true,
        durationMinutes: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
          },
        },
      },
    });

    if (!appointment) {
      return null;
    }

    const completedVisitCount = await this.prisma.appointment.count({
      where: {
        barbershopId,
        customerId: appointment.customer.id,
        status: 'COMPLETED',
      },
    });

    return { ...appointment, completedVisitCount };
  }

  async completeForBusiness(
    barbershopId: string,
    appointmentId: string,
    userId: string,
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

    const membership = await this.prisma.businessMember.findUnique({
      where: { userId_barbershopId: { userId, barbershopId } },
      select: { role: true },
    });
    const canComplete =
      membership?.role === 'OWNER' ||
      membership?.role === 'MANAGER' ||
      appointment.businessMember.userId === userId;

    if (!canComplete) {
      throw new ForbiddenException('Bu randevuyu tamamlama yetkin yok.');
    }

    if (appointment.status !== 'CONFIRMED') {
      throw new BadRequestException('Bu randevu tamamlanamaz.');
    }

    return this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }
}
