import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  AppointmentStatus,
  BookingRestrictionScope,
  NoShowCaseStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const disputeHours = 48;
const rollingDays = 90;

@Injectable()
export class NoShowService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NoShowService.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.reconcileExpiredCases().catch((error: unknown) => {
        this.logger.error('Gelmedi kayıtları kesinleştirilemedi.', error);
      });
    }, 60_000);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async mark(appointmentId: string, markedByUserId: string) {
    const now = new Date();
    const disputeDeadline = new Date(
      now.getTime() + disputeHours * 60 * 60 * 1000,
    );
    const result = await this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          id: true,
          barbershopId: true,
          customerId: true,
          dependentProfileId: true,
          status: true,
          startsAt: true,
          endsAt: true,
        },
      });
      if (!appointment) throw new NotFoundException('Randevu bulunamadı.');
      if (appointment.status !== AppointmentStatus.CONFIRMED) {
        throw new BadRequestException(
          'Bu randevu gelmedi olarak işaretlenemez.',
        );
      }
      if (now.getTime() < appointment.startsAt.getTime() + 15 * 60 * 1000) {
        throw new BadRequestException(
          'Randevu saatinden sonra en az 15 dakika beklemelisin.',
        );
      }
      if (now.getTime() > appointment.endsAt.getTime() + 60 * 60 * 1000) {
        throw new BadRequestException(
          'Bu randevu için gelmedi işaretleme süresi doldu.',
        );
      }
      const activeProposal = await tx.appointmentChangeProposal.findFirst({
        where: {
          appointmentId,
          status: 'PENDING',
          expiresAt: { gt: now },
        },
        select: { id: true },
      });
      if (activeProposal) {
        throw new BadRequestException(
          'Açık değişiklik teklifi bulunan randevu gelmedi işaretlenemez.',
        );
      }
      const updated = await tx.appointment.updateMany({
        where: { id: appointmentId, status: AppointmentStatus.CONFIRMED },
        data: { status: AppointmentStatus.NO_SHOW },
      });
      if (updated.count !== 1)
        throw new ConflictException('Randevu bu sırada değişti.');

      return tx.appointmentNoShowCase.create({
        data: {
          appointmentId,
          barbershopId: appointment.barbershopId,
          customerId: appointment.customerId,
          dependentProfileId: appointment.dependentProfileId,
          markedByUserId,
          markedAt: now,
          disputeDeadline,
        },
      });
    });
    void this.notifications.notifyAppointmentNoShow(appointmentId);
    return result;
  }

  async dispute(appointmentId: string, customerId: string, reason: string) {
    const now = new Date();
    const result = await this.prisma.appointmentNoShowCase.updateMany({
      where: {
        appointmentId,
        customerId,
        status: NoShowCaseStatus.PENDING_DISPUTE,
        disputeDeadline: { gt: now },
      },
      data: {
        status: NoShowCaseStatus.UNDER_REVIEW,
        disputeReason: reason.trim(),
        disputedAt: now,
      },
    });
    if (result.count === 1) return { success: true };

    const existing = await this.prisma.appointmentNoShowCase.findUnique({
      where: { appointmentId },
      select: { customerId: true, status: true, disputeDeadline: true },
    });
    if (!existing || existing.customerId !== customerId) {
      throw new NotFoundException('Gelmedi kaydı bulunamadı.');
    }
    throw new BadRequestException(
      existing.status === NoShowCaseStatus.UNDER_REVIEW
        ? 'Bu kayıt için itirazın zaten incelemede.'
        : 'Bu kayıt için itiraz süresi dolmuş veya karar verilmiş.',
    );
  }

  async assertCanBook(customerId: string, barbershopId: string) {
    await this.reconcileExpiredCases(customerId);
    const now = new Date();
    const restriction = await this.prisma.bookingRestriction.findFirst({
      where: {
        customerId,
        revokedAt: null,
        startsAt: { lte: now },
        expiresAt: { gt: now },
        OR: [
          { scope: BookingRestrictionScope.PLATFORM },
          { scope: BookingRestrictionScope.BARBERSHOP, barbershopId },
        ],
      },
      orderBy: { expiresAt: 'desc' },
      select: { scope: true, expiresAt: true },
    });
    if (restriction) {
      const date = new Intl.DateTimeFormat('tr-TR', {
        dateStyle: 'medium',
      }).format(restriction.expiresAt);
      throw new ForbiddenException(
        restriction.scope === BookingRestrictionScope.PLATFORM
          ? `Gelmedi kayıtları nedeniyle ${date} tarihine kadar yeni randevu alamazsın.`
          : `Bu işletmeden ${date} tarihine kadar yeni randevu alamazsın.`,
      );
    }
  }

  async getCustomerStatus(customerId: string) {
    await this.reconcileExpiredCases(customerId);
    const now = new Date();
    const periodStart = new Date(now.getTime() - rollingDays * 86_400_000);
    const [confirmedCount, pendingCount, underReviewCount, activeRestrictions] =
      await Promise.all([
        this.prisma.appointmentNoShowCase.count({
          where: {
            customerId,
            status: NoShowCaseStatus.CONFIRMED,
            markedAt: { gte: periodStart },
          },
        }),
        this.prisma.appointmentNoShowCase.count({
          where: { customerId, status: NoShowCaseStatus.PENDING_DISPUTE },
        }),
        this.prisma.appointmentNoShowCase.count({
          where: { customerId, status: NoShowCaseStatus.UNDER_REVIEW },
        }),
        this.prisma.bookingRestriction.findMany({
          where: {
            customerId,
            revokedAt: null,
            startsAt: { lte: now },
            expiresAt: { gt: now },
          },
          orderBy: { expiresAt: 'desc' },
          select: {
            id: true,
            scope: true,
            barbershopId: true,
            expiresAt: true,
            sourceCase: {
              select: {
                appointment: {
                  select: { barbershop: { select: { name: true } } },
                },
              },
            },
          },
        }),
      ]);
    return {
      confirmedCount,
      pendingCount,
      underReviewCount,
      activeRestrictions,
    };
  }

  async reconcileExpiredCases(customerId?: string) {
    const cases = await this.prisma.appointmentNoShowCase.findMany({
      where: {
        status: NoShowCaseStatus.PENDING_DISPUTE,
        disputeDeadline: { lte: new Date() },
        ...(customerId && { customerId }),
      },
      orderBy: [{ disputeDeadline: 'asc' }, { id: 'asc' }],
      select: { id: true },
      take: 100,
    });
    for (const item of cases) await this.confirmCase(item.id);
  }

  private async confirmCase(caseId: string) {
    const confirmedAppointmentId = await this.prisma.$transaction(
      async (tx) => {
        const now = new Date();
        const record = await tx.appointmentNoShowCase.findUnique({
          where: { id: caseId },
        });
        if (
          !record ||
          record.status !== NoShowCaseStatus.PENDING_DISPUTE ||
          record.disputeDeadline > now
        )
          return null;

        // A customer lock keeps two simultaneous confirmations from undercounting.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${record.customerId}, 0))`;
        const claimed = await tx.appointmentNoShowCase.updateMany({
          where: { id: caseId, status: NoShowCaseStatus.PENDING_DISPUTE },
          data: { status: NoShowCaseStatus.CONFIRMED, confirmedAt: now },
        });
        if (!claimed.count) return null;

        await this.applyRestrictions(tx, record, now);
        return record.appointmentId;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    if (confirmedAppointmentId) {
      void this.notifications.notifyNoShowDecision(
        confirmedAppointmentId,
        false,
        false,
      );
    }
  }

  private async applyRestrictions(
    tx: Prisma.TransactionClient,
    record: {
      id: string;
      customerId: string;
      barbershopId: string;
      markedAt: Date;
    },
    now: Date,
  ) {
    const periodStart = new Date(now.getTime() - rollingDays * 86_400_000);
    const priorCases = await tx.appointmentNoShowCase.findMany({
      where: {
        customerId: record.customerId,
        status: NoShowCaseStatus.CONFIRMED,
        markedAt: { gte: periodStart, lte: now },
      },
      select: { id: true, barbershopId: true },
    });
    const globalCount = priorCases.length;
    const businessCount = priorCases.filter(
      (item) => item.barbershopId === record.barbershopId,
    ).length;

    if (businessCount >= 2) {
      await tx.bookingRestriction.create({
        data: {
          customerId: record.customerId,
          barbershopId: record.barbershopId,
          scope: BookingRestrictionScope.BARBERSHOP,
          sourceCaseId: record.id,
          startsAt: now,
          expiresAt: new Date(
            now.getTime() + (businessCount >= 3 ? 30 : 14) * 86_400_000,
          ),
        },
      });
    }
    if (globalCount >= 3 && globalCount % 3 === 0) {
      await tx.bookingRestriction.create({
        data: {
          customerId: record.customerId,
          scope: BookingRestrictionScope.PLATFORM,
          sourceCaseId: record.id,
          startsAt: now,
          expiresAt: new Date(
            now.getTime() + (globalCount >= 6 ? 30 : 7) * 86_400_000,
          ),
        },
      });
    }
  }

  // Platform review can call this after an operator has verified the evidence.
  async resolveDispute(
    caseId: string,
    reviewerId: string,
    accepted: boolean,
    reviewNote: string,
  ) {
    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      const record = await tx.appointmentNoShowCase.findUnique({
        where: { id: caseId },
      });
      if (!record || record.status !== NoShowCaseStatus.UNDER_REVIEW) {
        throw new BadRequestException('İncelenecek açık itiraz bulunamadı.');
      }
      if (record.markedByUserId === reviewerId) {
        throw new ForbiddenException(
          'Kendi oluşturduğun gelinmedi kaydının itirazını inceleyemezsin.',
        );
      }
      const nextStatus = accepted
        ? NoShowCaseStatus.REVOKED
        : NoShowCaseStatus.CONFIRMED;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${record.customerId}, 0))`;
      const claimed = await tx.appointmentNoShowCase.updateMany({
        where: { id: caseId, status: NoShowCaseStatus.UNDER_REVIEW },
        data: {
          status: nextStatus,
          reviewedAt: now,
          reviewedByUserId: reviewerId,
          reviewNote,
          confirmedAt: accepted ? null : now,
        },
      });
      if (!claimed.count)
        throw new ConflictException('Bu itiraz daha önce sonuçlandırıldı.');
      if (accepted) {
        await tx.bookingRestriction.updateMany({
          where: { sourceCaseId: caseId, revokedAt: null },
          data: { revokedAt: now },
        });
        await tx.appointment.updateMany({
          where: {
            id: record.appointmentId,
            status: AppointmentStatus.NO_SHOW,
          },
          data: {
            status: AppointmentStatus.CANCELLED,
            cancelledAt: now,
            cancellationReason: 'Hatalı gelmedi kaydı geri alındı.',
          },
        });
      } else {
        await this.applyRestrictions(tx, record, now);
      }
      return {
        ...record,
        status: nextStatus,
        reviewedAt: now,
        reviewedByUserId: reviewerId,
        reviewNote,
      };
    });
    void this.notifications.notifyNoShowDecision(
      updated.appointmentId,
      accepted,
      true,
    );
    return updated;
  }
}
