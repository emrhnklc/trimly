import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { AppointmentsService } from './appointments.service';

@Controller('appointments')
@ApiTags('Müşteri Randevuları')
@UseGuards(JwtAuthGuard)
export class CustomerAppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('me')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.findForCustomer(user.id);
  }

  @Get(':appointmentId')
  findOne(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentsService.findOneForCustomer(appointmentId, user.id);
  }

  @Patch(':appointmentId/cancel')
  cancel(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentsService.cancelForCustomer(appointmentId, user.id);
  }
}
