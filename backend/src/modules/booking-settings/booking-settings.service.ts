import { Injectable, NotFoundException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { PrismaService } from '../../database/prisma.service';
import { UpdateBookingSettingsDto } from './dto/update-booking-settings.dto';

@Injectable()
export class BookingSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async find(barbershopId: string) {
    let settings = await this.prisma.bookingSettings.findUnique({
      where: { barbershopId },
    });

    if (!settings) {
      throw new NotFoundException('İşletme veya booking ayarları bulunamadı.');
    }

    if (
      settings.pendingSlotIntervalMinutes !== null &&
      settings.slotIntervalEffectiveFrom &&
      settings.slotIntervalEffectiveFrom <= new Date()
    ) {
      settings = await this.prisma.bookingSettings.update({
        where: { barbershopId },
        data: {
          slotIntervalMinutes: settings.pendingSlotIntervalMinutes,
          pendingSlotIntervalMinutes: null,
          slotIntervalEffectiveFrom: null,
        },
      });
    }

    return settings;
  }

  async update(barbershopId: string, dto: UpdateBookingSettingsDto) {
    const settings = await this.find(barbershopId);
    const barbershop = await this.prisma.barbershop.findUnique({
      where: { id: barbershopId },
      select: { timezone: true, isDiscoverable: true },
    });
    if (!barbershop) throw new NotFoundException('İşletme bulunamadı.');

    const { slotIntervalMinutes, ...immediateSettings } = dto;
    const slotUpdate =
      slotIntervalMinutes === undefined
        ? {}
        : !barbershop.isDiscoverable
          ? {
              slotIntervalMinutes,
              pendingSlotIntervalMinutes: null,
              slotIntervalEffectiveFrom: null,
            }
          : slotIntervalMinutes === settings.slotIntervalMinutes
            ? {
                pendingSlotIntervalMinutes: null,
                slotIntervalEffectiveFrom: null,
              }
            : slotIntervalMinutes === settings.pendingSlotIntervalMinutes
              ? {}
              : {
                  pendingSlotIntervalMinutes: slotIntervalMinutes,
                  slotIntervalEffectiveFrom: DateTime.now()
                    .setZone(barbershop.timezone)
                    .startOf('day')
                    .plus({ days: 1 })
                    .toUTC()
                    .toJSDate(),
                };

    return this.prisma.bookingSettings.update({
      where: { barbershopId },
      data: { ...immediateSettings, ...slotUpdate },
    });
  }
}
