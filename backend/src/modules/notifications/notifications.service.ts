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
  { field: 'reminder2hSentAt', leadMinutes: 2 * 60, minimumLeadMinutes: 0 },
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
          customer: { select: { firstName: true, lastName: true } },
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
      const customerName = `${appointment.customer.firstName} ${appointment.customer.lastName}`;
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
