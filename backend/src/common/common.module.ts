import { Global, Module } from '@nestjs/common';
import { BarbershopBookingAccessGuard } from './guards/barbershop-booking-access.guard';
import { BusinessRolesGuard } from './guards/business-roles.guard';

@Global()
@Module({
  providers: [BarbershopBookingAccessGuard, BusinessRolesGuard],
  exports: [BarbershopBookingAccessGuard, BusinessRolesGuard],
})
export class CommonModule {}
