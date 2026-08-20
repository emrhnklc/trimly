import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PushDeviceDto } from './dto/push-device.dto';

@Injectable()
export class NotificationsService {
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
}
