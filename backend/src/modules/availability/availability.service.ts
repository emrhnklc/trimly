import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AppointmentStatus,
  BusinessReliabilityActionType,
  Weekday,
} from '@prisma/client';
import { DateTime } from 'luxon';
import { PrismaService } from '../../database/prisma.service';
import { BarbershopReadinessService } from '../barbershops/barbershop-readiness.service';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { workingHoursForDate } from '../schedules/effective-working-hours';

const weekdays: Weekday[] = [
  Weekday.MONDAY,
  Weekday.TUESDAY,
  Weekday.WEDNESDAY,
  Weekday.THURSDAY,
  Weekday.FRIDAY,
  Weekday.SATURDAY,
  Weekday.SUNDAY,
];

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly barbershopReadinessService: BarbershopReadinessService,
  ) {}

  async findAvailableSlots(
    barbershopId: string,
    query: AvailabilityQueryDto,
    options?: {
      excludeAppointmentId?: string;
      ignoreBookingState?: boolean;
      ignoreBookingWindow?: boolean;
    },
  ) {
    if (!options?.ignoreBookingState) {
      await this.barbershopReadinessService.assertBookingOpen(barbershopId);
    }

    const barbershop = await this.prisma.barbershop.findUnique({
      where: { id: barbershopId },
      include: {
        bookingSettings: true,
      },
    });

    if (!barbershop) {
      throw new NotFoundException('İşletme bulunamadı.');
    }

    const targetDate = DateTime.fromISO(query.date, {
      zone: barbershop.timezone,
    }).startOf('day');

    if (!targetDate.isValid) {
      throw new BadRequestException('Geçerli bir tarih gönderilmelidir.');
    }

    const settings = barbershop.bookingSettings ?? {
      minBookingNoticeMinutes: 60,
      maxBookingAdvanceDays: 30,
      slotIntervalMinutes: 5,
      pendingSlotIntervalMinutes: null,
      slotIntervalEffectiveFrom: null,
    };
    const now = DateTime.now().setZone(barbershop.timezone);
    const today = now.startOf('day');
    const latestBookableDate = today.plus({
      days: settings.maxBookingAdvanceDays,
    });

    if (
      !options?.ignoreBookingWindow &&
      (targetDate < today || targetDate > latestBookableDate)
    ) {
      return this.emptyResult(query.date);
    }

    const weekday = weekdays[targetDate.weekday - 1];
    const [shopHours, member, service] = await Promise.all([
      this.prisma.workingHours.findUnique({
        where: { barbershopId_weekday: { barbershopId, weekday } },
      }),
      this.prisma.businessMember.findFirst({
        where: {
          id: query.memberId,
          barbershopId,
          isActive: true,
          isBookable: true,
          reliabilityActions: {
            none: {
              type: BusinessReliabilityActionType.MEMBER_REVIEW_HOLD,
              resolvedAt: null,
            },
          },
        },
        include: {
          workingHours: { where: { weekday } },
        },
      }),
      this.prisma.service.findFirst({
        where: { id: query.serviceId, barbershopId, isActive: true },
      }),
    ]);

    if (!member || !service) {
      return this.emptyResult(query.date);
    }

    const effectiveShopHours = workingHoursForDate(
      shopHours ? [shopHours] : [],
      barbershop.previousWorkingHours,
      barbershop.workingHoursEffectiveFrom,
      targetDate,
    ).find((hours) => hours.weekday === weekday);
    const effectiveMemberHours = workingHoursForDate(
      member.workingHours,
      member.previousWorkingHours,
      member.workingHoursEffectiveFrom,
      targetDate,
    ).find((hours) => hours.weekday === weekday);

    if (!effectiveShopHours || !effectiveMemberHours) {
      return this.emptyResult(query.date);
    }

    const assignment = await this.prisma.businessMemberService.findUnique({
      where: {
        businessMemberId_serviceId: {
          businessMemberId: member.id,
          serviceId: service.id,
        },
      },
    });

    if (!assignment) {
      return this.emptyResult(query.date);
    }

    const windowStart = DateTime.max(
      this.atLocalTime(targetDate, effectiveShopHours.startTime),
      this.atLocalTime(targetDate, effectiveMemberHours.startTime),
    );
    const windowEnd = DateTime.min(
      this.atLocalTime(targetDate, effectiveShopHours.endTime),
      this.atLocalTime(targetDate, effectiveMemberHours.endTime),
    );
    const earliestStart = options?.ignoreBookingWindow
      ? windowStart
      : DateTime.max(
          windowStart,
          now.plus({ minutes: settings.minBookingNoticeMinutes }),
        );
    const slotIntervalMinutes =
      settings.pendingSlotIntervalMinutes &&
      settings.slotIntervalEffectiveFrom &&
      targetDate >=
        DateTime.fromJSDate(settings.slotIntervalEffectiveFrom).setZone(
          barbershop.timezone,
        )
        ? settings.pendingSlotIntervalMinutes
        : settings.slotIntervalMinutes;
    const firstCandidate = this.roundUpToSlot(
      earliestStart,
      slotIntervalMinutes,
    );

    if (firstCandidate >= windowEnd) {
      return this.emptyResult(query.date);
    }

    const [blocks, appointments] = await Promise.all([
      this.prisma.memberScheduleBlock.findMany({
        where: {
          businessMemberId: member.id,
          startsAt: { lt: windowEnd.toJSDate() },
          endsAt: { gt: windowStart.toJSDate() },
        },
        select: { startsAt: true, endsAt: true },
      }),
      this.prisma.appointment.findMany({
        where: {
          businessMemberId: member.id,
          ...(options?.excludeAppointmentId && {
            id: { not: options.excludeAppointmentId },
          }),
          status: {
            in: [
              AppointmentStatus.CONFIRMED,
              AppointmentStatus.ARRIVED,
              AppointmentStatus.COMPLETED,
              AppointmentStatus.NO_SHOW,
            ],
          },
          startsAt: { lt: windowEnd.toJSDate() },
          endsAt: { gt: windowStart.toJSDate() },
        },
        select: { startsAt: true, endsAt: true },
      }),
    ]);
    const unavailableIntervals = [...blocks, ...appointments];
    const slots: Array<{
      startTime: string;
      startsAt: string;
      endsAt: string;
    }> = [];

    for (
      let candidate = firstCandidate;
      candidate < windowEnd;
      candidate = candidate.plus({ minutes: slotIntervalMinutes })
    ) {
      const endsAt = candidate.plus({ minutes: service.durationMinutes });

      if (endsAt > windowEnd) {
        continue;
      }

      const overlapsUnavailableTime = unavailableIntervals.some((interval) =>
        this.overlaps(
          candidate.toJSDate(),
          endsAt.toJSDate(),
          interval.startsAt,
          interval.endsAt,
        ),
      );

      if (!overlapsUnavailableTime) {
        slots.push({
          startTime: candidate.toFormat('HH:mm'),
          startsAt: candidate.toUTC().toISO()!,
          endsAt: endsAt.toUTC().toISO()!,
        });
      }
    }

    return { date: query.date, slots };
  }

  private emptyResult(date: string) {
    return { date, slots: [] };
  }

  private atLocalTime(date: DateTime, time: string) {
    const [hour, minute] = time.split(':').map(Number);
    return date.set({ hour, minute, second: 0, millisecond: 0 });
  }

  private roundUpToSlot(date: DateTime, intervalMinutes: number) {
    const secondsInMinute = date.second > 0 || date.millisecond > 0;
    const totalMinutes =
      date.hour * 60 + date.minute + (secondsInMinute ? 1 : 0);
    const roundedMinutes =
      Math.ceil(totalMinutes / intervalMinutes) * intervalMinutes;

    return date.startOf('day').plus({ minutes: roundedMinutes });
  }

  private overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
    return startA < endB && endA > startB;
  }
}
