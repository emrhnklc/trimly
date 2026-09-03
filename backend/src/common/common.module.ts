import { Global, Module } from '@nestjs/common';
import { EmailService } from './email/email.service';
import { BarbershopBookingAccessGuard } from './guards/barbershop-booking-access.guard';
import { BusinessRolesGuard } from './guards/business-roles.guard';

@Global()
@Module({
  providers: [BarbershopBookingAccessGuard, BusinessRolesGuard, EmailService],
  exports: [BarbershopBookingAccessGuard, BusinessRolesGuard, EmailService],
})
export class CommonModule {}
