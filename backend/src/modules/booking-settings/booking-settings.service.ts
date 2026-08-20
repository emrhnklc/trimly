import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateBookingSettingsDto } from './dto/update-booking-settings.dto';

@Injectable()
export class BookingSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async find(barbershopId: string) {
    const settings = await this.prisma.bookingSettings.findUnique({
      where: { barbershopId },
    });

    if (!settings) {
      throw new NotFoundException('İşletme veya booking ayarları bulunamadı.');
    }

    return settings;
  }

  async update(barbershopId: string, dto: UpdateBookingSettingsDto) {
    await this.find(barbershopId);

    return this.prisma.bookingSettings.update({
      where: { barbershopId },
      data: dto,
    });
  }
}
