import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { UpsertHaircutRecordDto } from './dto/upsert-haircut-record.dto';
import { HaircutHistoryService } from './haircut-history.service';

@Controller(
  'barbershops/:barbershopId/appointments/:appointmentId/haircut-record',
)
@UseGuards(JwtAuthGuard)
export class HaircutHistoryController {
  constructor(private readonly haircutHistoryService: HaircutHistoryService) {}

  @Post()
  upsert(
    @Param('barbershopId') barbershopId: string,
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertHaircutRecordDto,
  ) {
    return this.haircutHistoryService.upsertForAppointment(
      barbershopId,
      appointmentId,
      user.id,
      dto,
    );
  }
}
