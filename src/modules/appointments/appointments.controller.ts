import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BusinessRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { BusinessRolesGuard } from '../../common/guards/business-roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Controller('barbershops/:barbershopId/appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  findForBarbershop(@Param('barbershopId') barbershopId: string) {
    return this.appointmentsService.findForBarbershop(barbershopId);
  }

  @Get('next-for-me')
  @UseGuards(JwtAuthGuard)
  findNextForCurrentMember(
    @Param('barbershopId') barbershopId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentsService.findNextForCurrentMember(
      barbershopId,
      user.id,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Param('barbershopId') barbershopId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(barbershopId, user.id, dto);
  }

  @Patch(':appointmentId/complete')
  @UseGuards(JwtAuthGuard)
  complete(
    @Param('barbershopId') barbershopId: string,
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentsService.completeForBusiness(
      barbershopId,
      appointmentId,
      user.id,
    );
  }
}
