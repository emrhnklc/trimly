import { Injectable } from '@nestjs/common';
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
    const customersById = new Map(customers.map((customer) => [customer.id, customer]));

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
          nextAppointmentAt: upcomingAppointmentByCustomer.get(stat.customerId) ?? null,
        };
      })
      .filter((customer) => customer !== null)
      .sort((first, second) => {
        const firstActivity = first.lastVisitAt ?? first.lastAppointmentAt;
        const secondActivity = second.lastVisitAt ?? second.lastAppointmentAt;
        return (secondActivity?.getTime() ?? 0) - (firstActivity?.getTime() ?? 0);
      });
  }
}
