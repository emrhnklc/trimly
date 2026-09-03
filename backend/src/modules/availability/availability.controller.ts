import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BarbershopBookingAccessGuard } from '../../common/guards/barbershop-booking-access.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AvailabilityService } from './availability.service';
import { AvailabilityQueryDto } from './dto/availability-query.dto';

@Controller('barbershops/:barbershopId/availability')
@ApiTags('Müsaitlik')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  @UseGuards(JwtAuthGuard, BarbershopBookingAccessGuard)
  findAvailableSlots(
    @Param('barbershopId') barbershopId: string,
    @Query() query: AvailabilityQueryDto,
  ) {
    return this.availabilityService.findAvailableSlots(barbershopId, query);
  }
}
