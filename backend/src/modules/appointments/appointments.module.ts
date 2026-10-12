import { Module } from '@nestjs/common';
import { AvailabilityModule } from '../availability/availability.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { CustomerAppointmentsController } from './customer-appointments.controller';
import { NoShowService } from './no-show.service';
import { NoShowModerationController } from './no-show-moderation.controller';
import { BusinessReliabilityService } from './business-reliability.service';
import { BusinessCancellationModerationController } from './business-cancellation-moderation.controller';
import { BusinessCancellationRecoveryService } from './business-cancellation-recovery.service';

@Module({
  imports: [AvailabilityModule, NotificationsModule],
  controllers: [
    AppointmentsController,
    CustomerAppointmentsController,
    NoShowModerationController,
    BusinessCancellationModerationController,
  ],
  providers: [
    AppointmentsService,
    NoShowService,
    BusinessReliabilityService,
    BusinessCancellationRecoveryService,
  ],
})
export class AppointmentsModule {}
