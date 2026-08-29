import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Prisma } from '@prisma/client';
import { DateTime } from 'luxon';
import { AvailabilityService } from '../availability/availability.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../../database/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';

const customerAppointmentSelect = {
  id: true,
  startsAt: true,
  endsAt: true,
  status: true,
  serviceId: true,
  serviceNameSnapshot: true,
  priceSnapshot: true,
  durationMinutes: true,
  cancelledAt: true,
  completedAt: true,
  barbershop: {
    select: {
      id: true,
      name: true,
      slug: true,
      bookingSettings: {
        select: {
          customerCancellationEnabled: true,
          cancellationNoticeMinutes: true,
        },
      },
    },
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
} satisfies Prisma.AppointmentSelect;

type CustomerAppointmentRecord = Prisma.AppointmentGetPayload<{
  select: typeof customerAppointmentSelect;
}>;

const defaultCancellationSettings = {
  customerCancellationEnabled: true,
  cancellationNoticeMinutes: 120,
};

function getCancellationPolicy(
  status: AppointmentStatus,
  startsAt: Date,
  settings: typeof defaultCancellationSettings,
) {
  const cancellationDeadline = new Date(
    startsAt.getTime() - settings.cancellationNoticeMinutes * 60 * 1000,
  );

  if (status !== AppointmentStatus.CONFIRMED) {
    const statusReasons: Record<
      Exclude<AppointmentStatus, 'CONFIRMED'>,
      string
    > = {
      CANCELLED: 'Bu randevu iptal edilmiş.',
      COMPLETED: 'Tamamlanan randevular iptal edilemez.',
      NO_SHOW: 'Gelinmedi olarak işaretlenen randevular iptal edilemez.',
    };

    return {
      canCancel: false,
      cancellationDeadline,
      cancellationNoticeMinutes: settings.cancellationNoticeMinutes,
      cancellationReason: statusReasons[status],
    };
  }

  if (!settings.customerCancellationEnabled) {
    return {
      canCancel: false,
      cancellationDeadline,
      cancellationNoticeMinutes: settings.cancellationNoticeMinutes,
      cancellationReason: 'Bu işletme müşteri tarafından iptale izin vermiyor.',
    };
  }

  if (new Date() >= cancellationDeadline) {
    return {
      canCancel: false,
      cancellationDeadline,
      cancellationNoticeMinutes: settings.cancellationNoticeMinutes,
      cancellationReason: `Bu randevu en az ${settings.cancellationNoticeMinutes} dakika önceden iptal edilebilir.`,
    };
  }

  return {
    canCancel: true,
    cancellationDeadline,
    cancellationNoticeMinutes: settings.cancellationNoticeMinutes,
    cancellationReason: null,
  };
}

function presentCustomerAppointment(appointment: CustomerAppointmentRecord) {
  const { bookingSettings, ...barbershop } = appointment.barbershop;
  const cancellationSettings = bookingSettings ?? defaultCancellationSettings;

  return {
    ...appointment,
    barbershop,
    ...getCancellationPolicy(
      appointment.status,
      appointment.startsAt,
      cancellationSettings,
    ),
  };
}

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly availabilityService: AvailabilityService,
    private readonly notificationsService: NotificationsService,
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
      const appointment = await this.prisma.appointment.create({
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

      void this.notificationsService.notifyNewAppointment(appointment.id);

      return appointment;
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

  async findForCustomer(customerId: string) {
    const appointments = await this.prisma.appointment.findMany({
      where: { customerId },
      orderBy: { startsAt: 'desc' },
      select: customerAppointmentSelect,
    });

    return appointments.map(presentCustomerAppointment);
  }

  async findOneForCustomer(appointmentId: string, customerId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, customerId },
      select: customerAppointmentSelect,
    });

    if (!appointment) {
      throw new NotFoundException('Randevu bulunamadı.');
    }

    return presentCustomerAppointment(appointment);
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

    const cancellationSettings = appointment.barbershop.bookingSettings ?? {
      ...defaultCancellationSettings,
    };
    const cancellationPolicy = getCancellationPolicy(
      appointment.status,
      appointment.startsAt,
      cancellationSettings,
    );

    if (!cancellationPolicy.canCancel) {
      throw new BadRequestException(
        cancellationPolicy.cancellationReason ?? 'Bu randevu iptal edilemez.',
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
        durationMinutes: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            profileImageUrl: true,
          },
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

  async findDailySummary(barbershopId: string, date?: string) {
    const barbershop = await this.prisma.barbershop.findUnique({
      where: { id: barbershopId },
      select: { timezone: true },
    });

    if (!barbershop) {
      throw new NotFoundException('İşletme bulunamadı.');
    }

    const day = date
      ? DateTime.fromISO(date, { zone: barbershop.timezone }).startOf('day')
      : DateTime.now().setZone(barbershop.timezone).startOf('day');

    if (!day.isValid) {
      throw new BadRequestException('Geçerli bir tarih gönderilmelidir.');
    }

    const appointments = await this.prisma.appointment.findMany({
      where: {
        barbershopId,
        startsAt: {
          gte: day.toUTC().toJSDate(),
          lt: day.plus({ days: 1 }).toUTC().toJSDate(),
        },
      },
      select: {
        status: true,
        priceSnapshot: true,
        businessMember: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    const counts = {
      total: appointments.length,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
    };
    let completedRevenue = new Prisma.Decimal(0);
    const memberSummaries = new Map<
      string,
      {
        memberId: string;
        name: string;
        confirmed: number;
        completed: number;
        cancelled: number;
        noShow: number;
        completedRevenue: Prisma.Decimal;
      }
    >();

    for (const appointment of appointments) {
      const memberId = appointment.businessMember.id;
      const memberSummary = memberSummaries.get(memberId) ?? {
        memberId,
        name: `${appointment.businessMember.user.firstName} ${appointment.businessMember.user.lastName}`,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
        completedRevenue: new Prisma.Decimal(0),
      };

      if (appointment.status === 'CONFIRMED') {
        counts.confirmed += 1;
        memberSummary.confirmed += 1;
      }
      if (appointment.status === 'COMPLETED') {
        counts.completed += 1;
        completedRevenue = completedRevenue.plus(appointment.priceSnapshot);
        memberSummary.completed += 1;
        memberSummary.completedRevenue = memberSummary.completedRevenue.plus(
          appointment.priceSnapshot,
        );
      }
      if (appointment.status === 'CANCELLED') {
        counts.cancelled += 1;
        memberSummary.cancelled += 1;
      }
      if (appointment.status === 'NO_SHOW') {
        counts.noShow += 1;
        memberSummary.noShow += 1;
      }

      memberSummaries.set(memberId, memberSummary);
    }

    return {
      date: day.toISODate(),
      timezone: barbershop.timezone,
      ...counts,
      completedRevenue: completedRevenue.toFixed(2),
      byMember: [...memberSummaries.values()].map((member) => ({
        ...member,
        completedRevenue: member.completedRevenue.toFixed(2),
      })),
    };
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

  async cancelForBusiness(
    barbershopId: string,
    appointmentId: string,
    userId: string,
    dto: CancelAppointmentDto,
  ) {
    const appointment = await this.findManageableAppointment(
      barbershopId,
      appointmentId,
      userId,
    );

    if (appointment.status !== 'CONFIRMED') {
      throw new BadRequestException('Bu randevu iptal edilemez.');
    }

    return this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: dto.reason?.trim(),
      },
    });
  }

  async rescheduleForBusiness(
    barbershopId: string,
    appointmentId: string,
    userId: string,
    dto: RescheduleAppointmentDto,
  ) {
    const appointment = await this.findManageableAppointment(
      barbershopId,
      appointmentId,
      userId,
      {
        serviceId: true,
        businessMemberId: true,
        barbershop: { select: { timezone: true } },
      },
    );

    if (appointment.status !== 'CONFIRMED') {
      throw new BadRequestException('Bu randevu yeniden planlanamaz.');
    }

    const requestedStart = DateTime.fromISO(dto.startsAt, { setZone: true });
    if (!requestedStart.isValid) {
      throw new BadRequestException(
        'Geçerli bir başlangıç zamanı gönderilmelidir.',
      );
    }

    const date = requestedStart
      .setZone(appointment.barbershop.timezone)
      .toISODate();
    if (!date) {
      throw new BadRequestException(
        'Geçerli bir başlangıç zamanı gönderilmelidir.',
      );
    }

    const memberId = dto.memberId ?? appointment.businessMemberId;
    const availability = await this.availabilityService.findAvailableSlots(
      barbershopId,
      { memberId, serviceId: appointment.serviceId, date },
      { excludeAppointmentId: appointment.id, ignoreBookingWindow: true },
    );
    const selectedSlot = availability.slots.find(
      (slot) =>
        DateTime.fromISO(slot.startsAt).toMillis() ===
        requestedStart.toMillis(),
    );

    if (!selectedSlot) {
      throw new ConflictException('Yeni seçilen saat uygun değil.');
    }

    try {
      return await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          businessMemberId: memberId,
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

  async markNoShowForBusiness(
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
    const canMarkNoShow =
      membership?.role === 'OWNER' ||
      membership?.role === 'MANAGER' ||
      appointment.businessMember.userId === userId;

    if (!canMarkNoShow) {
      throw new ForbiddenException(
        'Bu randevuyu no-show işaretleme yetkin yok.',
      );
    }

    if (appointment.status !== 'CONFIRMED') {
      throw new BadRequestException('Bu randevu no-show işaretlenemez.');
    }

    return this.prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: 'NO_SHOW' },
    });
  }

  private async findManageableAppointment<
    ExtraSelect extends Prisma.AppointmentSelect,
  >(
    barbershopId: string,
    appointmentId: string,
    userId: string,
    extraSelect?: ExtraSelect,
  ) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, barbershopId },
      select: {
        id: true,
        status: true,
        businessMember: { select: { userId: true } },
        ...extraSelect,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Randevu bulunamadı.');
    }

    const membership = await this.prisma.businessMember.findUnique({
      where: { userId_barbershopId: { userId, barbershopId } },
      select: { role: true },
    });
    const canManage =
      membership?.role === 'OWNER' ||
      membership?.role === 'MANAGER' ||
      appointment.businessMember.userId === userId;

    if (!canManage) {
      throw new ForbiddenException('Bu randevuyu yönetme yetkin yok.');
    }

    return appointment;
  }
}
