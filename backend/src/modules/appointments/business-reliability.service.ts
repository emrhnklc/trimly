import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AppointmentStatus,
  BusinessCancellationPointReason,
  BusinessCancellationAppealStatus,
  BusinessCancellationExemptionReason,
  BusinessReliabilityActionType,
  BusinessRole,
  Prisma,
} from '@prisma/client';
import { DateTime } from 'luxon';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const rollingWindowMs = 90 * 86_400_000;
const dayMs = 86_400_000;
const hourMs = 60 * 60_000;

export function businessCancellationPoints(
  startsAt: Date,
  cancelledAt: Date,
  customerArrived: boolean,
) {
  const leadMs = startsAt.getTime() - cancelledAt.getTime();
  const minutesBeforeStart = Math.floor(leadMs / 60_000);
  if (customerArrived) {
    return {
      minutesBeforeStart,
      pointReason: BusinessCancellationPointReason.CUSTOMER_ARRIVED,
      points: 3,
    };
  }
  if (leadMs <= 0) {
    return {
      minutesBeforeStart,
      pointReason: BusinessCancellationPointReason.AFTER_START,
      points: 3,
    };
  }
  if (leadMs > dayMs) {
    return {
      minutesBeforeStart,
      pointReason: BusinessCancellationPointReason.MORE_THAN_24_HOURS,
      points: 0,
    };
  }
  if (leadMs >= 6 * hourMs) {
    return {
      minutesBeforeStart,
      pointReason: BusinessCancellationPointReason.BETWEEN_6_AND_24_HOURS,
      points: 1,
    };
  }
  if (leadMs >= 2 * hourMs) {
    return {
      minutesBeforeStart,
      pointReason: BusinessCancellationPointReason.BETWEEN_2_AND_6_HOURS,
      points: 2,
    };
  }
  return {
    minutesBeforeStart,
    pointReason: BusinessCancellationPointReason.LESS_THAN_2_HOURS,
    points: 3,
  };
}

@Injectable()
export class BusinessReliabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async cancelAppointment(
    barbershopId: string,
    appointmentId: string,
    actorUserId: string,
    reason: string,
  ) {
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 3) {
      throw new BadRequestException('İptal nedeni en az 3 karakter olmalıdır.');
    }
    if (/^müşteri\s+(talebi|istedi)$/iu.test(trimmedReason)) {
      throw new BadRequestException(
        'Müşteri talebi, müşterinin doğrulaması olmadan işletme iptal nedeni olarak kullanılamaz.',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${barbershopId}, 0))`;
      const appointment = await tx.appointment.findFirst({
        where: { id: appointmentId, barbershopId },
        select: {
          id: true,
          status: true,
          startsAt: true,
          businessMemberId: true,
          businessMember: { select: { userId: true } },
        },
      });
      if (!appointment) throw new NotFoundException('Randevu bulunamadı.');

      const membership = await tx.businessMember.findUnique({
        where: { userId_barbershopId: { userId: actorUserId, barbershopId } },
        select: { isActive: true, role: true },
      });
      const canManage =
        membership?.isActive &&
        (membership.role === BusinessRole.OWNER ||
          membership.role === BusinessRole.MANAGER ||
          (membership.role === BusinessRole.BARBER &&
            appointment.businessMember.userId === actorUserId));
      if (!canManage)
        throw new ForbiddenException('Bu randevuyu yönetme yetkin yok.');
      if (
        appointment.status !== AppointmentStatus.CONFIRMED &&
        appointment.status !== AppointmentStatus.ARRIVED
      ) {
        throw new BadRequestException('Bu randevu iptal edilemez.');
      }

      const cancelledAt = new Date();
      const { minutesBeforeStart, pointReason, points } =
        businessCancellationPoints(
          appointment.startsAt,
          cancelledAt,
          appointment.status === AppointmentStatus.ARRIVED,
        );
      const updated = await tx.appointment.updateMany({
        where: {
          id: appointmentId,
          status: {
            in: [AppointmentStatus.CONFIRMED, AppointmentStatus.ARRIVED],
          },
        },
        data: {
          status: AppointmentStatus.CANCELLED,
          cancelledAt,
          cancellationReason: trimmedReason,
          arrivedAt: null,
          autoCompleteAt: null,
        },
      });
      if (!updated.count)
        throw new ConflictException('Randevu bu sırada değişti.');

      const event = await tx.businessCancellationEvent.create({
        data: {
          appointmentId,
          barbershopId,
          businessMemberId: appointment.businessMemberId,
          cancelledByUserId: actorUserId,
          reason: trimmedReason,
          cancelledAt,
          minutesBeforeStart,
          pointReason,
          points,
        },
      });
      const impact = await this.applyActions(tx, event);
      const cancelledAppointment = await tx.appointment.findUniqueOrThrow({
        where: { id: appointmentId },
      });
      return {
        appointment: cancelledAppointment,
        eventId: event.id,
        reliabilityImpact: {
          pointsAwarded: points,
          pointReason,
          totalPoints90Days: impact.totalPoints,
          triggeredActions: impact.triggeredActionTypes,
        },
      };
    });
    void this.notifications.notifyBusinessCancellation(appointmentId);
    if (result.reliabilityImpact.pointsAwarded > 0) {
      void this.notifications.notifyBusinessReliabilityImpact(
        result.eventId,
        result.reliabilityImpact.totalPoints90Days,
      );
    }
    return {
      ...result.appointment,
      reliabilityImpact: result.reliabilityImpact,
    };
  }

  async cancelAfterRejectedChangeProposal(
    appointmentId: string,
    customerId: string,
  ) {
    const reason = 'Müşteri işletmenin değişiklik teklifini reddetti.';
    const result = await this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findFirst({
        where: { id: appointmentId, customerId },
        select: {
          id: true,
          barbershopId: true,
          businessMemberId: true,
          startsAt: true,
          status: true,
        },
      });
      if (!appointment) throw new NotFoundException('Randevu bulunamadı.');

      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${appointment.barbershopId}, 0))`;
      const latestProposal = await tx.appointmentChangeProposal.findFirst({
        where: { appointmentId },
        orderBy: { createdAt: 'desc' },
        select: {
          status: true,
          createdByMember: { select: { userId: true } },
        },
      });
      if (
        appointment.status !== AppointmentStatus.CONFIRMED ||
        latestProposal?.status !== 'REJECTED'
      ) {
        throw new BadRequestException(
          'Reddedilmiş işletme teklifiyle ilişkili aktif randevu bulunamadı.',
        );
      }

      const cancelledAt = new Date();
      const { minutesBeforeStart, pointReason, points } =
        businessCancellationPoints(appointment.startsAt, cancelledAt, false);
      const updated = await tx.appointment.updateMany({
        where: { id: appointmentId, status: AppointmentStatus.CONFIRMED },
        data: {
          status: AppointmentStatus.CANCELLED,
          cancelledAt,
          cancellationReason: reason,
          arrivedAt: null,
          autoCompleteAt: null,
        },
      });
      if (!updated.count)
        throw new ConflictException('Randevu bu sırada değişti.');

      const event = await tx.businessCancellationEvent.create({
        data: {
          appointmentId,
          barbershopId: appointment.barbershopId,
          businessMemberId: appointment.businessMemberId,
          cancelledByUserId: latestProposal.createdByMember.userId,
          reason,
          cancelledAt,
          minutesBeforeStart,
          pointReason,
          points,
        },
      });
      const impact = await this.applyActions(tx, event);
      const cancelledAppointment = await tx.appointment.findUniqueOrThrow({
        where: { id: appointmentId },
      });
      return {
        appointment: cancelledAppointment,
        eventId: event.id,
        reliabilityImpact: {
          pointsAwarded: points,
          pointReason,
          totalPoints90Days: impact.totalPoints,
          triggeredActions: impact.triggeredActionTypes,
        },
      };
    });

    void this.notifications.notifyBusinessCancellation(appointmentId);
    if (result.reliabilityImpact.pointsAwarded > 0) {
      void this.notifications.notifyBusinessReliabilityImpact(
        result.eventId,
        result.reliabilityImpact.totalPoints90Days,
      );
    }
    return {
      ...result.appointment,
      reliabilityImpact: result.reliabilityImpact,
    };
  }

  private async applyActions(
    tx: Prisma.TransactionClient,
    event: {
      id: string;
      barbershopId: string;
      businessMemberId: string;
      cancelledAt: Date;
      points: number;
    },
  ) {
    const periodStart = new Date(event.cancelledAt.getTime() - rollingWindowMs);
    const events = await tx.businessCancellationEvent.findMany({
      where: {
        barbershopId: event.barbershopId,
        cancelledAt: { gte: periodStart, lte: event.cancelledAt },
        appealStatus: { not: BusinessCancellationAppealStatus.APPROVED },
      },
      select: { businessMemberId: true, points: true },
    });
    const total = events.reduce((sum, item) => sum + item.points, 0);
    const before = total - event.points;
    const memberPoints = new Map<string, number>();
    for (const item of events) {
      memberPoints.set(
        item.businessMemberId,
        (memberPoints.get(item.businessMemberId) ?? 0) + item.points,
      );
    }
    const currentMemberPoints = memberPoints.get(event.businessMemberId) ?? 0;
    const triggeredActionTypes: BusinessReliabilityActionType[] = [];

    const create = async (
      type: BusinessReliabilityActionType,
      options?: { memberId?: string; endsAt?: Date; thresholdPoints?: number },
    ) => {
      await tx.businessReliabilityAction.create({
        data: {
          type,
          barbershopId: event.barbershopId,
          businessMemberId: options?.memberId,
          sourceEventId: event.id,
          startsAt: event.cancelledAt,
          endsAt: options?.endsAt,
          thresholdPoints: options?.thresholdPoints,
        },
      });
      triggeredActionTypes.push(type);
    };

    if (before < 3 && total >= 3) {
      await create(BusinessReliabilityActionType.WARNING, {
        endsAt: new Date(event.cancelledAt.getTime() + 90 * dayMs),
        thresholdPoints: 3,
      });
    }
    if (currentMemberPoints - event.points < 5 && currentMemberPoints >= 5) {
      await create(BusinessReliabilityActionType.MEMBER_REVIEW_HOLD, {
        memberId: event.businessMemberId,
        thresholdPoints: 5,
      });
    }
    if (before < 5 && total >= 5 && currentMemberPoints < 5) {
      await create(BusinessReliabilityActionType.DISCOVERY_DEMOTION, {
        endsAt: new Date(event.cancelledAt.getTime() + 7 * dayMs),
        thresholdPoints: 5,
      });
    }
    if (before < 8 && total >= 8) {
      await create(BusinessReliabilityActionType.BOOKING_SUSPENSION, {
        endsAt: new Date(event.cancelledAt.getTime() + 3 * dayMs),
        thresholdPoints: 8,
      });
    }
    if (before < 16 && total >= 16) {
      await create(BusinessReliabilityActionType.BOOKING_SUSPENSION, {
        endsAt: new Date(event.cancelledAt.getTime() + 7 * dayMs),
        thresholdPoints: 16,
      });
      await create(BusinessReliabilityActionType.MANUAL_REVIEW, {
        thresholdPoints: 16,
      });
    }
    return { totalPoints: total, triggeredActionTypes };
  }

  async getStatus(barbershopId: string) {
    const now = new Date();
    const barbershop = await this.prisma.barbershop.findUnique({
      where: { id: barbershopId },
      select: { timezone: true },
    });
    if (!barbershop) throw new NotFoundException('İşletme bulunamadı.');

    const localNow = DateTime.fromJSDate(now).setZone(barbershop.timezone);
    const startOfToday = localNow.startOf('day').toUTC().toJSDate();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * dayMs);
    const sevenDaysAgo = new Date(now.getTime() - 7 * dayMs);

    const [
      events,
      actions,
      fulfilledAppointments30Days,
      recentOutcomes,
      recentCancellations,
    ] = await Promise.all([
      this.prisma.businessCancellationEvent.findMany({
        where: {
          barbershopId,
          cancelledAt: { gte: new Date(now.getTime() - rollingWindowMs) },
        },
        select: {
          points: true,
          pointReason: true,
          appealStatus: true,
          cancelledAt: true,
          businessMemberId: true,
        },
      }),
      this.prisma.businessReliabilityAction.findMany({
        where: {
          barbershopId,
          resolvedAt: null,
          OR: [{ endsAt: null }, { endsAt: { gt: now } }],
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: {
          id: true,
          type: true,
          businessMemberId: true,
          businessMember: {
            select: { user: { select: { firstName: true, lastName: true } } },
          },
          startsAt: true,
          endsAt: true,
          resolvedAt: true,
        },
      }),
      this.prisma.appointment.count({
        where: {
          barbershopId,
          startsAt: { gte: thirtyDaysAgo, lte: now },
          status: {
            in: [AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW],
          },
        },
      }),
      this.prisma.appointment.findMany({
        where: {
          barbershopId,
          status: {
            in: [
              AppointmentStatus.COMPLETED,
              AppointmentStatus.NO_SHOW,
              AppointmentStatus.CANCELLED,
            ],
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
        select: {
          status: true,
          businessCancellation: { select: { id: true } },
        },
      }),
      this.prisma.businessCancellationEvent.findMany({
        where: {
          barbershopId,
          cancelledAt: { gte: new Date(now.getTime() - rollingWindowMs) },
        },
        orderBy: { cancelledAt: 'desc' },
        take: 20,
        select: {
          id: true,
          appointmentId: true,
          cancelledAt: true,
          reason: true,
          points: true,
          pointReason: true,
          minutesBeforeStart: true,
          appealStatus: true,
          appealReason: true,
          appealReviewNote: true,
          appointment: {
            select: {
              attendeeNameSnapshot: true,
              serviceNameSnapshot: true,
              startsAt: true,
            },
          },
          businessMember: {
            select: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
      }),
    ]);

    const effectiveEvents = events.filter(
      (event) =>
        event.appealStatus !== BusinessCancellationAppealStatus.APPROVED,
    );
    const events30Days = effectiveEvents.filter(
      (event) => event.cancelledAt >= thirtyDaysAgo,
    );
    const handledAppointments30Days =
      fulfilledAppointments30Days + events30Days.length;
    const cancellationRate30Days = handledAppointments30Days
      ? Math.round((events30Days.length / handledAppointments30Days) * 1_000) /
        10
      : 0;
    const eventsToday = effectiveEvents.filter(
      (event) => event.cancelledAt >= startOfToday,
    );
    const memberCountsToday = new Map<string, number>();
    for (const event of eventsToday) {
      memberCountsToday.set(
        event.businessMemberId,
        (memberCountsToday.get(event.businessMemberId) ?? 0) + 1,
      );
    }
    let consecutiveBusinessCancellations = 0;
    for (const outcome of recentOutcomes) {
      if (
        outcome.status === AppointmentStatus.CANCELLED &&
        outcome.businessCancellation
      ) {
        consecutiveBusinessCancellations += 1;
        continue;
      }
      if (outcome.status === AppointmentStatus.COMPLETED) break;
    }

    return {
      points90Days: effectiveEvents.reduce(
        (sum, event) => sum + event.points,
        0,
      ),
      cancellationCount90Days: events.length,
      metrics30Days: {
        businessCancellationCount: events30Days.length,
        handledAppointmentCount: handledAppointments30Days,
        cancellationRatePercent: cancellationRate30Days,
        informationalOnly: handledAppointments30Days < 10,
      },
      operationalSignals: {
        cancellationsToday: eventsToday.length,
        maxMemberCancellationsToday: Math.max(0, ...memberCountsToday.values()),
        consecutiveBusinessCancellations,
        earlyCancellations7Days: effectiveEvents.filter(
          (event) =>
            event.cancelledAt >= sevenDaysAgo &&
            event.pointReason ===
              BusinessCancellationPointReason.MORE_THAN_24_HOURS,
        ).length,
      },
      actions,
      recentCancellations,
    };
  }

  async requestAppeal(
    barbershopId: string,
    eventId: string,
    actorUserId: string,
    reason: string,
  ) {
    const membership = await this.prisma.businessMember.findUnique({
      where: { userId_barbershopId: { userId: actorUserId, barbershopId } },
      select: { isActive: true, role: true },
    });
    if (
      !membership?.isActive ||
      (membership.role !== BusinessRole.OWNER &&
        membership.role !== BusinessRole.MANAGER)
    ) {
      throw new ForbiddenException(
        'Bu iptal kaydı için inceleme isteyemezsin.',
      );
    }
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 10) {
      throw new BadRequestException(
        'İtiraz açıklaması en az 10 karakter olmalıdır.',
      );
    }
    const updated = await this.prisma.businessCancellationEvent.updateMany({
      where: {
        id: eventId,
        barbershopId,
        points: { gt: 0 },
        appealStatus: BusinessCancellationAppealStatus.NOT_REQUESTED,
      },
      data: {
        appealStatus: BusinessCancellationAppealStatus.PENDING,
        appealReason: trimmedReason,
        appealRequestedByUserId: actorUserId,
        appealRequestedAt: new Date(),
      },
    });
    if (!updated.count) {
      throw new BadRequestException(
        'Bu iptal kaydı için yeni bir inceleme isteği açılamaz.',
      );
    }
    return { success: true };
  }

  listPendingAppeals() {
    return this.prisma.businessCancellationEvent.findMany({
      where: { appealStatus: BusinessCancellationAppealStatus.PENDING },
      orderBy: { appealRequestedAt: 'asc' },
      select: {
        id: true,
        appointmentId: true,
        barbershopId: true,
        businessMemberId: true,
        cancelledByUserId: true,
        cancelledAt: true,
        reason: true,
        points: true,
        appealReason: true,
        appealRequestedAt: true,
        appealRequestedByUserId: true,
      },
    });
  }

  async reviewAppeal(
    eventId: string,
    reviewerId: string,
    approved: boolean,
    note: string,
    exemptionReason?: BusinessCancellationExemptionReason,
  ) {
    if (approved && !exemptionReason) {
      throw new BadRequestException(
        'Kabul edilen itiraz için istisna nedeni seçilmelidir.',
      );
    }
    const trimmedNote = note.trim();
    if (trimmedNote.length < 10) {
      throw new BadRequestException(
        'İnceleme notu en az 10 karakter olmalıdır.',
      );
    }
    const result = await this.prisma.$transaction(async (tx) => {
      const event = await tx.businessCancellationEvent.findUnique({
        where: { id: eventId },
      });
      if (
        !event ||
        event.appealStatus !== BusinessCancellationAppealStatus.PENDING
      ) {
        throw new NotFoundException('Açık işletme iptali itirazı bulunamadı.');
      }
      const reviewerMembership = await tx.businessMember.findUnique({
        where: {
          userId_barbershopId: {
            userId: reviewerId,
            barbershopId: event.barbershopId,
          },
        },
        select: { id: true },
      });
      if (
        reviewerMembership ||
        event.cancelledByUserId === reviewerId ||
        event.appealRequestedByUserId === reviewerId
      ) {
        throw new ForbiddenException(
          'Kendi işletmenin iptal itirazını inceleyemezsin.',
        );
      }
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${event.barbershopId}, 0))`;
      const now = new Date();
      const claimed = await tx.businessCancellationEvent.updateMany({
        where: {
          id: eventId,
          appealStatus: BusinessCancellationAppealStatus.PENDING,
        },
        data: {
          appealStatus: approved
            ? BusinessCancellationAppealStatus.APPROVED
            : BusinessCancellationAppealStatus.REJECTED,
          appealReviewedAt: now,
          appealReviewedByUserId: reviewerId,
          appealReviewNote: trimmedNote,
          exemptionReason: approved ? exemptionReason : null,
        },
      });
      if (!claimed.count)
        throw new ConflictException('İtiraz bu sırada sonuçlandırıldı.');
      if (approved)
        await this.reconcileActionsAfterExemption(tx, event.barbershopId, now);
      return { success: true, barbershopId: event.barbershopId };
    });
    void this.notifications.notifyBusinessCancellationAppealDecision(
      eventId,
      approved,
    );
    return result;
  }

  private async reconcileActionsAfterExemption(
    tx: Prisma.TransactionClient,
    barbershopId: string,
    now: Date,
  ) {
    const [events, actions] = await Promise.all([
      tx.businessCancellationEvent.findMany({
        where: {
          barbershopId,
          cancelledAt: { gte: new Date(now.getTime() - rollingWindowMs) },
          appealStatus: { not: BusinessCancellationAppealStatus.APPROVED },
        },
        select: { businessMemberId: true, points: true },
      }),
      tx.businessReliabilityAction.findMany({
        where: {
          barbershopId,
          resolvedAt: null,
          OR: [{ endsAt: null }, { endsAt: { gt: now } }],
        },
        select: {
          id: true,
          type: true,
          businessMemberId: true,
          thresholdPoints: true,
        },
      }),
    ]);
    const total = events.reduce((sum, event) => sum + event.points, 0);
    for (const action of actions) {
      const memberTotal = action.businessMemberId
        ? events
            .filter(
              (event) => event.businessMemberId === action.businessMemberId,
            )
            .reduce((sum, event) => sum + event.points, 0)
        : 0;
      const score =
        action.type === BusinessReliabilityActionType.MEMBER_REVIEW_HOLD
          ? memberTotal
          : total;
      if (score < (action.thresholdPoints ?? 0)) {
        await tx.businessReliabilityAction.updateMany({
          where: { id: action.id, resolvedAt: null },
          data: { resolvedAt: now },
        });
      }
    }
  }

  async resolveMemberHold(
    barbershopId: string,
    actionId: string,
    actorUserId: string,
  ) {
    const membership = await this.prisma.businessMember.findUnique({
      where: { userId_barbershopId: { userId: actorUserId, barbershopId } },
      select: { isActive: true, role: true },
    });
    if (!membership?.isActive || membership.role !== BusinessRole.OWNER) {
      throw new ForbiddenException(
        'Çalışan programını yalnız işletme sahibi doğrulayabilir.',
      );
    }
    const updated = await this.prisma.businessReliabilityAction.updateMany({
      where: {
        id: actionId,
        barbershopId,
        type: BusinessReliabilityActionType.MEMBER_REVIEW_HOLD,
        resolvedAt: null,
      },
      data: { resolvedAt: new Date(), resolvedByUserId: actorUserId },
    });
    if (!updated.count)
      throw new NotFoundException('Açık çalışan programı kontrolü bulunamadı.');
    return { success: true };
  }
}
