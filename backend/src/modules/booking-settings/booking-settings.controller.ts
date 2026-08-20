import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BusinessRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { BusinessRolesGuard } from '../../common/guards/business-roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookingSettingsService } from './booking-settings.service';
import { UpdateBookingSettingsDto } from './dto/update-booking-settings.dto';

@Controller('barbershops/:barbershopId/booking-settings')
@ApiTags('Booking Ayarları')
export class BookingSettingsController {
  constructor(
    private readonly bookingSettingsService: BookingSettingsService,
  ) {}

  @Get()
  find(@Param('barbershopId') barbershopId: string) {
    return this.bookingSettingsService.find(barbershopId);
  }

  @Put()
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  update(
    @Param('barbershopId') barbershopId: string,
    @Body() dto: UpdateBookingSettingsDto,
  ) {
    return this.bookingSettingsService.update(barbershopId, dto);
  }
}
