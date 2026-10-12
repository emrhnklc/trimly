import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { BusinessRole } from '@prisma/client';
import { DateTime } from 'luxon';
import { PrismaService } from '../../database/prisma.service';
import { PushDeviceDto } from './dto/push-device.dto';
import { UpdateNotificationPreferenceDto } from './dto/update-notification-preference.dto';

type ReminderField = 'reminder24hSentAt' | 'reminder2hSentAt';

const appointmentReminderSchedules: Array<{
  field: ReminderField;
  leadMinutes: number;
  minimumLeadMinutes: number;
}> = [
  {
    field: 'reminder24hSentAt',
    leadMinutes: 24 * 60,
    minimumLeadMinutes: 12 * 60,
  },
  {
    field: 'reminder2hSentAt',
    leadMinutes: 2 * 60,
    minimumLeadMinutes: 115,
  },
];

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private reminderTimer?: ReturnType<typeof setInterval>;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.reminderTimer = setInterval(() => {
      void this.reconcileAppointmentReminders().catch((error: unknown) => {
        this.logger.error('Randevu hatırlatmaları çalıştırılamadı.', error);
      });
    }, 60_000);
    this.reminderTimer.unref();
  }

  onModuleDestroy() {
    if (this.reminderTimer) clearInterval(this.reminderTimer);
  }

  registerPushDevice(userId: string, dto: PushDeviceDto) {
    return this.prisma.pushDevice.upsert({
      where: { expoPushToken: dto.expoPushToken },
      create: {
        userId,
        expoPushToken: dto.expoPushToken,
        platform: dto.platform,
      },
      update: { userId, platform: dto.platform },
      select: { id: true, platform: true, updatedAt: true },
    });
  }

  async unregisterPushDevice(userId: string, expoPushToken: string) {
    await this.prisma.pushDevice.deleteMany({
      where: { userId, expoPushToken },
    });

    return { success: true };
  }

  getPreferences(userId: string) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  updatePreferences(userId: string, dto: UpdateNotificationPreferenceDto) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    });
  }

  listForUser(userId: string) {
    return this.prisma.appNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        readAt: true,
        createdAt: true,
        barbershop: { select: { id: true, name: true } },
        appointment: { select: { id: true } },
      },
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const updated = await this.prisma.appNotification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date() },
    });

    if (updated.count === 0) {
      throw new NotFoundException('Bildirim bulunamadı.');
    }

    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.appNotification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });

    return { success: true };
  }

  async reconcileAppointmentReminders() {
    const now = new Date();

    for (const schedule of appointmentReminderSchedules) {
      const latestStart = new Date(
        now.getTime() + schedule.leadMinutes * 60 * 1000,
      );
      const earliestStart = new Date(
        now.getTime() + schedule.minimumLeadMinutes * 60 * 1000,
      );
      const appointments = await this.prisma.appointment.findMany({
        where: {
          status: 'CONFIRMED',
          startsAt: { gt: earliestStart, lte: latestStart },
          [schedule.field]: null,
        },
        select: {
          id: true,
          startsAt: true,
          updatedAt: true,
          serviceNameSnapshot: true,
          customer: {
            select: {
              id: true,
              firstName: true,
              notificationPreference: {
                select: { appointmentRemindersEnabled: true },
              },
              pushDevices: { select: { expoPushToken: true } },
            },
          },
          barbershop: { select: { id: true, name: true, timezone: true } },
        },
      });

      for (const appointment of appointments) {
        const reminderThreshold = new Date(
          appointment.startsAt.getTime() - schedule.leadMinutes * 60 * 1000,
        );
        if (appointment.updatedAt > reminderThreshold) {
          await this.prisma.appointment.updateMany({
            where: {
              id: appointment.id,
              status: 'CONFIRMED',
              [schedule.field]: null,
            },
            data: { [schedule.field]: now },
          });
          continue;
        }

        if (
          appointment.customer.notificationPreference
            ?.appointmentRemindersEnabled === false
        ) {
          continue;
        }

        const claimed = await this.prisma.appointment.updateMany({
          where: {
            id: appointment.id,
            status: 'CONFIRMED',
            [schedule.field]: null,
          },
          data: { [schedule.field]: now },
        });
        if (claimed.count === 0) continue;

        const time = DateTime.fromJSDate(appointment.startsAt)
          .setZone(appointment.barbershop.timezone)
          .toFormat('HH:mm');
        const title = 'Randevu hatırlatması';
        const body =
          schedule.field === 'reminder24hSentAt'
            ? `Yarın ${time} için ${appointment.barbershop.name} randevun var.`
            : `${appointment.barbershop.name} randevuna 2 saat kaldı (${time}).`;

        await this.prisma.appNotification.create({
          data: {
            userId: appointment.customer.id,
            barbershopId: appointment.barbershop.id,
            appointmentId: appointment.id,
            type: 'APPOINTMENT_REMINDER',
            title,
            body,
          },
        });

        await this.sendExpoPush(
          appointment.customer.pushDevices.map(
            (device) => device.expoPushToken,
          ),
          {
            appointmentId: appointment.id,
            barbershopId: appointment.barbershop.id,
            type: 'APPOINTMENT_REMINDER',
          },
          title,
          body,
        );
      }
    }
  }

  async notifyNewAppointment(appointmentId: string) {
    try {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          id: true,
          startsAt: true,
          serviceNameSnapshot: true,
          attendeeNameSnapshot: true,
          barbershop: {
            select: {
              id: true,
              timezone: true,
              members: {
                where: {
                  isActive: true,
                  role: { in: [BusinessRole.OWNER, BusinessRole.MANAGER] },
                },
                select: { userId: true },
              },
            },
          },
          businessMember: {
            select: {
              userId: true,
              user: {
                select: { pushDevices: { select: { expoPushToken: true } } },
              },
            },
          },
        },
      });

      if (!appointment) return;

      const startsAt = DateTime.fromJSDate(appointment.startsAt)
        .setZone(appointment.barbershop.timezone)
        .toFormat('HH:mm');
      const customerName = appointment.attendeeNameSnapshot;
      const title = 'Yeni randevu';
      const body = `${customerName} — ${appointment.serviceNameSnapshot} — ${startsAt}`;
      const recipientUserIds = [
        ...new Set([
          appointment.businessMember.userId,
          ...appointment.barbershop.members.map((member) => member.userId),
        ]),
      ];

      await this.prisma.appNotification.createMany({
        data: recipientUserIds.map((userId) => ({
          userId,
          barbershopId: appointment.barbershop.id,
          appointmentId: appointment.id,
          type: 'NEW_APPOINTMENT',
          title,
          body,
        })),
      });

      const tokens = appointment.businessMember.user.pushDevices.map(
        (device) => device.expoPushToken,
      );
      if (tokens.length === 0) return;

      await this.sendExpoPush(
        tokens,
        {
          type: 'NEW_APPOINTMENT',
          appointmentId: appointment.id,
          barbershopId: appointment.barbershop.id,
        },
        title,
        body,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Bilinmeyen hata';
      this.logger.warn(`Yeni randevu bildirimi gönderilemedi: ${message}`);
    }
  }

  async notifyPortfolioConsentRequest(appointmentId: string) {
    try {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          id: true,
          customer: {
            select: {
              id: true,
              pushDevices: { select: { expoPushToken: true } },
            },
          },
          barbershop: { select: { id: true, name: true } },
        },
      });
      if (!appointment) return;

      const title = 'Portföy yayın izni';
      const body = `${appointment.barbershop.name}, tıraş fotoğrafını portföyünde yayınlamak için onayını istiyor.`;
      await this.prisma.appNotification.create({
        data: {
          userId: appointment.customer.id,
          barbershopId: appointment.barbershop.id,
          appointmentId: appointment.id,
          type: 'PORTFOLIO_CONSENT_REQUEST',
          title,
          body,
        },
      });
      await this.sendExpoPush(
        appointment.customer.pushDevices.map((device) => device.expoPushToken),
        {
          appointmentId: appointment.id,
          barbershopId: appointment.barbershop.id,
          type: 'PORTFOLIO_CONSENT_REQUEST',
        },
        title,
        body,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Bilinmeyen hata';
      this.logger.warn(`Portföy izin bildirimi gönderilemedi: ${message}`);
    }
  }

  async notifyAppointmentChangeProposal(proposalId: string) {
    try {
      const proposal = await this.prisma.appointmentChangeProposal.findUnique({
        where: { id: proposalId },
        select: {
          appointment: {
            select: {
              id: true,
              customer: {
                select: {
                  id: true,
                  pushDevices: { select: { expoPushToken: true } },
                },
              },
              barbershop: {
                select: { id: true, name: true, timezone: true },
              },
            },
          },
          proposedStartsAt: true,
          reason: true,
        },
      });
      if (!proposal) return;

      const appointment = proposal.appointment;
      const proposedTime = DateTime.fromJSDate(proposal.proposedStartsAt)
        .setZone(appointment.barbershop.timezone)
        .setLocale('tr')
        .toFormat('d LLLL HH:mm');
      const title = 'Randevu değişiklik teklifi';
      const body = `${appointment.barbershop.name}, randevunu ${proposedTime} olarak değiştirmeyi teklif ediyor. Açıklama: ${proposal.reason}`;

      await this.prisma.appNotification.create({
        data: {
          userId: appointment.customer.id,
          barbershopId: appointment.barbershop.id,
          appointmentId: appointment.id,
          type: 'APPOINTMENT_CHANGE_PROPOSAL',
          title,
          body,
        },
      });
      await this.sendExpoPush(
        appointment.customer.pushDevices.map((device) => device.expoPushToken),
        {
          appointmentId: appointment.id,
          barbershopId: appointment.barbershop.id,
          type: 'APPOINTMENT_CHANGE_PROPOSAL',
        },
        title,
        body,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Bilinmeyen hata';
      this.logger.warn(
        `Randevu değişiklik teklifi bildirimi gönderilemedi: ${message}`,
      );
    }
  }

  async notifyAppointmentNoShow(appointmentId: string) {
    try {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          id: true,
          barbershopId: true,
          barbershop: { select: { name: true } },
          customer: {
            select: {
              id: true,
              pushDevices: { select: { expoPushToken: true } },
            },
          },
        },
      });
      if (!appointment) return;
      const title = 'Randevuya gelinmedi kaydı';
      const body = `${appointment.barbershop.name} randevunu gelinmedi olarak işaretledi. 48 saat içinde randevu detayından itiraz edebilirsin. İnceleme süresince ceza uygulanmaz.`;
      await this.prisma.appNotification.create({
        data: {
          userId: appointment.customer.id,
          barbershopId: appointment.barbershopId,
          appointmentId,
          type: 'APPOINTMENT_NO_SHOW',
          title,
          body,
        },
      });
      await this.sendExpoPush(
        appointment.customer.pushDevices.map((device) => device.expoPushToken),
        {
          appointmentId,
          barbershopId: appointment.barbershopId,
          type: 'APPOINTMENT_NO_SHOW',
        },
        title,
        body,
      );
    } catch (error) {
      this.logger.warn(
        `Gelmedi bildirimi gönderilemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
      );
    }
  }

  async notifyBusinessCancellation(appointmentId: string) {
    try {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          id: true,
          barbershopId: true,
          cancellationReason: true,
          barbershop: { select: { name: true } },
          customer: {
            select: {
              id: true,
              pushDevices: { select: { expoPushToken: true } },
            },
          },
        },
      });
      if (!appointment) return;
      const title = 'İşletme randevunu iptal etti';
      const body = `${appointment.barbershop.name} randevunu iptal etti. Neden: ${appointment.cancellationReason ?? 'Belirtilmedi'}. Bu iptal sana ceza olarak yansımaz.`;
      await this.prisma.appNotification.create({
        data: {
          userId: appointment.customer.id,
          barbershopId: appointment.barbershopId,
          appointmentId,
          type: 'APPOINTMENT_BUSINESS_CANCELLED',
          title,
          body,
        },
      });
      await this.sendExpoPush(
        appointment.customer.pushDevices.map((device) => device.expoPushToken),
        {
          appointmentId,
          barbershopId: appointment.barbershopId,
          type: 'APPOINTMENT_BUSINESS_CANCELLED',
        },
        title,
        body,
      );
    } catch (error) {
      this.logger.warn(
        `İşletme iptal bildirimi gönderilemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
      );
    }
  }

  async notifyBusinessReliabilityImpact(
    eventId: string,
    totalPoints90Days: number,
  ) {
    try {
      const event = await this.prisma.businessCancellationEvent.findUnique({
        where: { id: eventId },
        select: {
          appointmentId: true,
          barbershopId: true,
          cancelledByUserId: true,
          points: true,
          pointReason: true,
          barbershop: {
            select: {
              name: true,
              members: {
                where: {
                  isActive: true,
                  role: { in: [BusinessRole.OWNER, BusinessRole.MANAGER] },
                },
                select: {
                  user: {
                    select: {
                      id: true,
                      pushDevices: { select: { expoPushToken: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });
      if (!event || event.points <= 0) return;

      const recipients = event.barbershop.members
        .map((member) => member.user)
        .filter((user) => user.id !== event.cancelledByUserId);
      if (!recipients.length) return;

      const reason = {
        AFTER_START: 'randevu başladıktan sonra iptal edildi',
        CUSTOMER_ARRIVED: 'müşteri geldi durumundayken iptal edildi',
        LESS_THAN_2_HOURS: 'randevuya 2 saatten az kala iptal edildi',
        BETWEEN_2_AND_6_HOURS: 'randevuya 2–6 saat kala iptal edildi',
        BETWEEN_6_AND_24_HOURS: 'randevuya 6–24 saat kala iptal edildi',
        BETWEEN_2_AND_24_HOURS: 'randevuya 2–24 saat kala iptal edildi',
        MORE_THAN_24_HOURS: 'randevuya 24 saatten fazla kala iptal edildi',
      }[event.pointReason];
      const title = `${event.barbershop.name}: +${event.points} güvenilirlik puanı`;
      const body = `Bir randevu ${reason}. Son 90 gündeki aktif puan: ${totalPoints90Days}. Ayrıntıları İşletme Güvenilirliği ekranından inceleyebilirsin.`;

      await this.prisma.appNotification.createMany({
        data: recipients.map((user) => ({
          userId: user.id,
          barbershopId: event.barbershopId,
          appointmentId: event.appointmentId,
          type: 'BUSINESS_RELIABILITY_POINTS_ADDED',
          title,
          body,
        })),
      });
      await this.sendExpoPush(
        recipients.flatMap((user) =>
          user.pushDevices.map((device) => device.expoPushToken),
        ),
        {
          appointmentId: event.appointmentId,
          barbershopId: event.barbershopId,
          type: 'BUSINESS_RELIABILITY_POINTS_ADDED',
        },
        title,
        body,
      );
    } catch (error) {
      this.logger.warn(
        `İşletme güvenilirlik bildirimi gönderilemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
      );
    }
  }

  async notifyBusinessCancellationAppealDecision(
    eventId: string,
    approved: boolean,
  ) {
    try {
      const event = await this.prisma.businessCancellationEvent.findUnique({
        where: { id: eventId },
        select: {
          appointmentId: true,
          barbershopId: true,
          appealRequestedByUserId: true,
          appealReviewNote: true,
        },
      });
      if (!event?.appealRequestedByUserId) return;
      const user = await this.prisma.user.findUnique({
        where: { id: event.appealRequestedByUserId },
        select: {
          id: true,
          pushDevices: { select: { expoPushToken: true } },
        },
      });
      if (!user) return;
      const title = approved
        ? 'İşletme iptal itirazı kabul edildi'
        : 'İşletme iptal itirazı reddedildi';
      const body = `${approved ? 'Bu iptalin ceza puanı kaldırıldı.' : 'Bu iptalin ceza puanı korundu.'} İnceleme notu: ${event.appealReviewNote ?? 'Belirtilmedi'}`;
      await this.prisma.appNotification.create({
        data: {
          userId: user.id,
          barbershopId: event.barbershopId,
          appointmentId: event.appointmentId,
          type: 'BUSINESS_CANCELLATION_APPEAL_DECISION',
          title,
          body,
        },
      });
      await this.sendExpoPush(
        user.pushDevices.map((device) => device.expoPushToken),
        {
          appointmentId: event.appointmentId,
          barbershopId: event.barbershopId,
          type: 'BUSINESS_CANCELLATION_APPEAL_DECISION',
        },
        title,
        body,
      );
    } catch (error) {
      this.logger.warn(
        `İşletme iptal itirazı bildirimi gönderilemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
      );
    }
  }

  async notifyNoShowDecision(
    appointmentId: string,
    accepted: boolean,
    reviewed: boolean,
  ) {
    try {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          barbershopId: true,
          customer: {
            select: {
              id: true,
              pushDevices: { select: { expoPushToken: true } },
            },
          },
        },
      });
      if (!appointment) return;
      const title = accepted
        ? 'Gelinmedi itirazın kabul edildi'
        : reviewed
          ? 'Gelinmedi itirazın sonuçlandı'
          : 'Gelinmedi kaydı kesinleşti';
      const body = accepted
        ? 'Gelinmedi kaydı geri alındı. Bu kayıt ceza hesabına alınmayacak.'
        : reviewed
          ? 'İtirazın reddedildi. Gelinmedi kaydı kesinleşti; varsa randevu kısıtını yeni rezervasyon sırasında görebilirsin.'
          : '48 saatlik itiraz süresi dolduğu için gelinmedi kaydı kesinleşti. İlk kayıt uyarıdır; tekrarında randevu kısıtı uygulanabilir.';
      await this.prisma.appNotification.create({
        data: {
          userId: appointment.customer.id,
          barbershopId: appointment.barbershopId,
          appointmentId,
          type: 'APPOINTMENT_NO_SHOW',
          title,
          body,
        },
      });
      await this.sendExpoPush(
        appointment.customer.pushDevices.map((device) => device.expoPushToken),
        {
          appointmentId,
          barbershopId: appointment.barbershopId,
          type: 'APPOINTMENT_NO_SHOW',
        },
        title,
        body,
      );
    } catch (error) {
      this.logger.warn(
        `Gelinmedi kararı bildirilemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
      );
    }
  }

  private async sendExpoPush(
    tokens: string[],
    data: { appointmentId: string; barbershopId: string; type: string },
    title: string,
    body: string,
  ) {
    if (tokens.length === 0) return;

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        tokens.map((to) => ({
          to,
          channelId: 'appointments',
          sound: 'default',
          title,
          body,
          data,
        })),
      ),
    });

    if (!response.ok) {
      throw new Error(`Expo Push Service ${response.status} döndü.`);
    }
  }
}
