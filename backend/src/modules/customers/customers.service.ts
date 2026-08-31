import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByBarbershop(barbershopId: string) {
    const [appointmentStats, completedVisitStats, upcomingAppointments] =
      await Promise.all([
        this.prisma.appointment.groupBy({
          by: ['customerId'],
          where: { barbershopId },
          _count: { _all: true },
          _min: { startsAt: true },
          _max: { startsAt: true },
        }),
        this.prisma.appointment.groupBy({
          by: ['customerId'],
          where: { barbershopId, status: 'COMPLETED' },
          _count: { _all: true },
          _max: { startsAt: true },
        }),
        this.prisma.appointment.findMany({
          where: {
            barbershopId,
            status: 'CONFIRMED',
            startsAt: { gte: new Date() },
          },
          distinct: ['customerId'],
          orderBy: [{ customerId: 'asc' }, { startsAt: 'asc' }],
          select: { customerId: true, startsAt: true },
        }),
      ]);

    if (!appointmentStats.length) return [];

    const customerIds = appointmentStats.map((stat) => stat.customerId);
    const customers = await this.prisma.user.findMany({
      where: { id: { in: customerIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        profileImageUrl: true,
      },
    });

    const completedVisitsByCustomer = new Map(
      completedVisitStats.map((stat) => [stat.customerId, stat]),
    );
    const upcomingAppointmentByCustomer = new Map(
      upcomingAppointments.map((appointment) => [
        appointment.customerId,
        appointment.startsAt,
      ]),
    );
    const customersById = new Map(
      customers.map((customer) => [customer.id, customer]),
    );

    return appointmentStats
      .map((stat) => {
        const customer = customersById.get(stat.customerId);
        if (!customer) return null;

        const completedVisits = completedVisitsByCustomer.get(stat.customerId);

        return {
          ...customer,
          totalAppointmentCount: stat._count._all,
          completedVisitCount: completedVisits?._count._all ?? 0,
          firstAppointmentAt: stat._min.startsAt,
          lastAppointmentAt: stat._max.startsAt,
          lastVisitAt: completedVisits?._max.startsAt ?? null,
          nextAppointmentAt:
            upcomingAppointmentByCustomer.get(stat.customerId) ?? null,
        };
      })
      .filter((customer) => customer !== null)
      .sort((first, second) => {
        const firstActivity = first.lastVisitAt ?? first.lastAppointmentAt;
        const secondActivity = second.lastVisitAt ?? second.lastAppointmentAt;
        return (
          (secondActivity?.getTime() ?? 0) - (firstActivity?.getTime() ?? 0)
        );
      });
  }

  async findOneByBarbershop(barbershopId: string, customerId: string) {
    const appointments = await this.prisma.appointment.findMany({
      where: { barbershopId, customerId },
      orderBy: { startsAt: 'desc' },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        status: true,
        serviceNameSnapshot: true,
        priceSnapshot: true,
        durationMinutes: true,
        cancellationReason: true,
        businessMember: {
          select: {
            id: true,
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        haircutRecord: {
          select: {
            styleName: true,
            notes: true,
          },
        },
      },
    });

    if (!appointments.length) {
      throw new NotFoundException('Müşteri bu işletmede bulunamadı.');
    }

    const customer = await this.prisma.user.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        profileImageUrl: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Müşteri bulunamadı.');
    }

    const completedAppointments = appointments.filter(
      (appointment) => appointment.status === 'COMPLETED',
    );
    const upcomingAppointment = [...appointments]
      .filter(
        (appointment) =>
          appointment.status === 'CONFIRMED' &&
          appointment.startsAt.getTime() >= Date.now(),
      )
      .sort(
        (first, second) => first.startsAt.getTime() - second.startsAt.getTime(),
      )[0];

    return {
      ...customer,
      totalAppointmentCount: appointments.length,
      completedVisitCount: completedAppointments.length,
      firstAppointmentAt: appointments.at(-1)?.startsAt ?? null,
      lastAppointmentAt: appointments[0]?.startsAt ?? null,
      lastVisitAt: completedAppointments[0]?.startsAt ?? null,
      nextAppointmentAt: upcomingAppointment?.startsAt ?? null,
      appointments,
    };
  }
}
