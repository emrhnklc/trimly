import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { PrismaService } from '../../database/prisma.service';
import { PushDeviceDto } from './dto/push-device.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

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

  async notifyNewAppointment(appointmentId: string) {
    try {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          id: true,
          startsAt: true,
          serviceNameSnapshot: true,
          customer: { select: { firstName: true, lastName: true } },
          barbershop: { select: { id: true, timezone: true } },
          businessMember: {
            select: {
              user: {
                select: { pushDevices: { select: { expoPushToken: true } } },
              },
            },
          },
        },
      });

      if (!appointment) return;

      const tokens = appointment.businessMember.user.pushDevices.map(
        (device) => device.expoPushToken,
      );
      if (tokens.length === 0) return;

      const startsAt = DateTime.fromJSDate(appointment.startsAt)
        .setZone(appointment.barbershop.timezone)
        .toFormat('HH:mm');
      const customerName = `${appointment.customer.firstName} ${appointment.customer.lastName}`;
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          tokens.map((to) => ({
            to,
            sound: 'default',
            title: 'Yeni randevu',
            body: `${customerName} — ${appointment.serviceNameSnapshot} — ${startsAt}`,
            data: {
              type: 'NEW_APPOINTMENT',
              appointmentId: appointment.id,
              barbershopId: appointment.barbershop.id,
            },
          })),
        ),
      });

      if (!response.ok) {
        throw new Error(`Expo Push Service ${response.status} döndü.`);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Bilinmeyen hata';
      this.logger.warn(`Yeni randevu bildirimi gönderilemedi: ${message}`);
    }
  }
}
