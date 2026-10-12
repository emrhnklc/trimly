import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { AppointmentsService } from './appointments.service';
import { DisputeNoShowDto } from './dto/dispute-no-show.dto';
import { BusinessCancellationRecoveryService } from './business-cancellation-recovery.service';

@Controller('appointments')
@ApiTags('Müşteri Randevuları')
@UseGuards(JwtAuthGuard)
export class CustomerAppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly recoveryService: BusinessCancellationRecoveryService,
  ) {}

  @Get('me')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.findForCustomer(user.id);
  }

  @Get('no-show/status')
  noShowStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.getCustomerNoShowStatus(user.id);
  }

  @Get(':appointmentId')
  findOne(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentsService.findOneForCustomer(appointmentId, user.id);
  }

  @Get(':appointmentId/recovery-options')
  @Header('Cache-Control', 'private, no-store, max-age=0')
  recoveryOptions(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.recoveryService.getOptions(appointmentId, user.id);
  }

  @Patch(':appointmentId/cancel')
  cancel(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentsService.cancelForCustomer(appointmentId, user.id);
  }

  @Patch(':appointmentId/no-show/dispute')
  disputeNoShow(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DisputeNoShowDto,
  ) {
    return this.appointmentsService.disputeNoShow(
      appointmentId,
      user.id,
      dto.reason,
    );
  }

  @Patch(':appointmentId/change-proposal/accept')
  acceptChangeProposal(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentsService.respondToChangeProposal(
      appointmentId,
      user.id,
      'ACCEPTED',
    );
  }

  @Patch(':appointmentId/change-proposal/reject')
  rejectChangeProposal(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentsService.respondToChangeProposal(
      appointmentId,
      user.id,
      'REJECTED',
    );
  }
}
