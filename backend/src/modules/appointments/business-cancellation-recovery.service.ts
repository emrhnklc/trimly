import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, BusinessRole } from '@prisma/client';
import { DateTime } from 'luxon';
import { PrismaService } from '../../database/prisma.service';
import { AvailabilityService } from '../availability/availability.service';

const suggestionLimit = 4;
const searchDayLimit = 7;

@Injectable()
export class BusinessCancellationRecoveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService,
  ) {}

  async getOptions(appointmentId: string, customerId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        customerId,
        status: AppointmentStatus.CANCELLED,
        businessCancellation: { isNot: null },
      },
      select: {
        barbershopId: true,
        serviceId: true,
        barbershop: {
          select: {
            id: true,
            name: true,
            slug: true,
            timezone: true,
            latitude: true,
            longitude: true,
            bookingSettings: { select: { maxBookingAdvanceDays: true } },
          },
        },
      },
    });
    if (!appointment) {
      throw new NotFoundException(
        'İşletmenin iptal ettiği randevu bulunamadı.',
      );
    }

    const { barbershop } = appointment;
    const members = await this.prisma.businessMember.findMany({
      where: {
        barbershopId: appointment.barbershopId,
        isActive: true,
        isBookable: true,
        role: {
          in: [BusinessRole.OWNER, BusinessRole.MANAGER, BusinessRole.BARBER],
        },
        serviceAssignments: { some: { serviceId: appointment.serviceId } },
        reliabilityActions: {
          none: { type: 'MEMBER_REVIEW_HOLD', resolvedAt: null },
        },
      },
      select: {
        id: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });
    const searchedDays = Math.min(
      searchDayLimit,
      Math.max(
        0,
        (barbershop.bookingSettings?.maxBookingAdvanceDays ?? 14) + 1,
      ),
    );
    const today = DateTime.now().setZone(barbershop.timezone).startOf('day');
    const options: {
      memberId: string;
      memberName: string;
      date: string;
      startTime: string;
      startsAt: string;
    }[] = [];
    // Without a bookable employee for this service, the customer cannot
    // continue with this shop even if it accepts other types of bookings.
    let bookingOpen = members.length > 0;

    for (
      let offset = 0;
      members.length > 0 &&
      offset < searchedDays &&
      options.length < suggestionLimit;
      offset++
    ) {
      const date = today.plus({ days: offset }).toISODate()!;
      try {
        const results = await Promise.all(
          members.map(async (member) => ({
            member,
            result: await this.availability.findAvailableSlots(
              appointment.barbershopId,
              {
                date,
                memberId: member.id,
                serviceId: appointment.serviceId,
              },
            ),
          })),
        );
        options.push(
          ...results.flatMap(({ member, result }) =>
            result.slots.slice(0, 2).map((slot) => ({
              memberId: member.id,
              memberName: `${member.user.firstName} ${member.user.lastName}`,
              date,
              startTime: slot.startTime,
              startsAt: slot.startsAt,
            })),
          ),
        );
        options.sort((first, second) =>
          first.startsAt.localeCompare(second.startsAt),
        );
        options.splice(suggestionLimit);
      } catch (error) {
        if (!this.isBookingClosed(error)) throw error;
        bookingOpen = false;
        break;
      }
    }

    return {
      shop: {
        id: barbershop.id,
        name: barbershop.name,
        slug: barbershop.slug,
        latitude: barbershop.latitude,
        longitude: barbershop.longitude,
      },
      serviceId: appointment.serviceId,
      bookingOpen,
      searchedDays,
      options,
    };
  }

  private isBookingClosed(error: unknown) {
    if (!(error instanceof ConflictException)) return false;
    const response = error.getResponse();
    return (
      typeof response === 'object' &&
      response !== null &&
      'code' in response &&
      response.code === 'BARBERSHOP_BOOKING_CLOSED'
    );
  }
}
