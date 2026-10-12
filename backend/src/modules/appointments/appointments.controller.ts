import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BusinessRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { BarbershopBookingAccessGuard } from '../../common/guards/barbershop-booking-access.guard';
import { BusinessRolesGuard } from '../../common/guards/business-roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { AppointmentsService } from './appointments.service';
import { BusinessReliabilityService } from './business-reliability.service';
import { RequestBusinessCancellationAppealDto } from './dto/request-business-cancellation-appeal.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { DailySummaryQueryDto } from './dto/daily-summary-query.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { RevenueSummaryQueryDto } from './dto/revenue-summary-query.dto';

@Controller('barbershops/:barbershopId/appointments')
@ApiTags('İşletme Randevuları')
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly businessReliabilityService: BusinessReliabilityService,
  ) {}

  @Get('reliability')
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  getReliability(@Param('barbershopId') barbershopId: string) {
    return this.businessReliabilityService.getStatus(barbershopId);
  }

  @Patch('reliability/cancellations/:eventId/appeal')
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  requestCancellationAppeal(
    @Param('barbershopId') barbershopId: string,
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RequestBusinessCancellationAppealDto,
  ) {
    return this.businessReliabilityService.requestAppeal(
      barbershopId,
      eventId,
      user.id,
      dto.reason,
    );
  }

  @Patch('reliability/member-holds/:actionId/resolve')
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER)
  resolveMemberHold(
    @Param('barbershopId') barbershopId: string,
    @Param('actionId') actionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.businessReliabilityService.resolveMemberHold(
      barbershopId,
      actionId,
      user.id,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  findForBarbershop(@Param('barbershopId') barbershopId: string) {
    return this.appointmentsService.findForBarbershop(barbershopId);
  }

  @Get('daily-summary')
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  findDailySummary(
    @Param('barbershopId') barbershopId: string,
    @Query() query: DailySummaryQueryDto,
  ) {
    return this.appointmentsService.findDailySummary(barbershopId, query.date);
  }

  @Get('revenue-summary')
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  findRevenueSummary(
    @Param('barbershopId') barbershopId: string,
    @Query() query: RevenueSummaryQueryDto,
  ) {
    return this.appointmentsService.findRevenueSummary(
      barbershopId,
      query.period,
      query.anchor,
    );
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findForCurrentMember(
    @Param('barbershopId') barbershopId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentsService.findForCurrentMember(barbershopId, user.id);
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

  @Get(':appointmentId')
  @UseGuards(JwtAuthGuard)
  findOneForBusiness(
    @Param('barbershopId') barbershopId: string,
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentsService.findOneForBusiness(
      barbershopId,
      appointmentId,
      user.id,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, BarbershopBookingAccessGuard)
  create(
    @Param('barbershopId') barbershopId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(barbershopId, user.id, dto);
  }

  @Patch(':appointmentId/cancel')
  @UseGuards(JwtAuthGuard)
  cancelForBusiness(
    @Param('barbershopId') barbershopId: string,
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CancelAppointmentDto,
  ) {
    return this.appointmentsService.cancelForBusiness(
      barbershopId,
      appointmentId,
      user.id,
      dto,
    );
  }

  @Patch(':appointmentId/reschedule')
  @UseGuards(JwtAuthGuard)
  reschedule(
    @Param('barbershopId') barbershopId: string,
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    return this.appointmentsService.rescheduleForBusiness(
      barbershopId,
      appointmentId,
      user.id,
      dto,
    );
  }

  @Patch(':appointmentId/change-proposal/cancel')
  @UseGuards(JwtAuthGuard)
  cancelChangeProposal(
    @Param('barbershopId') barbershopId: string,
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentsService.cancelChangeProposal(
      barbershopId,
      appointmentId,
      user.id,
    );
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

  @Patch(':appointmentId/arrived')
  @UseGuards(JwtAuthGuard)
  markArrived(
    @Param('barbershopId') barbershopId: string,
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentsService.markArrivedForBusiness(
      barbershopId,
      appointmentId,
      user.id,
    );
  }

  @Patch(':appointmentId/undo-arrival')
  @UseGuards(JwtAuthGuard)
  undoArrival(
    @Param('barbershopId') barbershopId: string,
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentsService.undoArrivalForBusiness(
      barbershopId,
      appointmentId,
      user.id,
    );
  }

  @Patch(':appointmentId/no-show')
  @UseGuards(JwtAuthGuard)
  markNoShow(
    @Param('barbershopId') barbershopId: string,
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentsService.markNoShowForBusiness(
      barbershopId,
      appointmentId,
      user.id,
    );
  }
}
