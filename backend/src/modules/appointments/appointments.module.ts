import { Module } from '@nestjs/common';
import { AvailabilityModule } from '../availability/availability.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { CustomerAppointmentsController } from './customer-appointments.controller';

@Module({
  imports: [AvailabilityModule],
  controllers: [AppointmentsController, CustomerAppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
