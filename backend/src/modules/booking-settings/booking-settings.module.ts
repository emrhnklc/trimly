import { Module } from '@nestjs/common';
import { BookingSettingsController } from './booking-settings.controller';
import { BookingSettingsService } from './booking-settings.service';

@Module({
  controllers: [BookingSettingsController],
  providers: [BookingSettingsService],
})
export class BookingSettingsModule {}
