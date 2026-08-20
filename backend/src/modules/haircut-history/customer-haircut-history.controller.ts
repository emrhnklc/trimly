import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { HaircutHistoryService } from './haircut-history.service';

@Controller('haircut-records')
@ApiTags('Tıraş Geçmişi')
@UseGuards(JwtAuthGuard)
export class CustomerHaircutHistoryController {
  constructor(private readonly haircutHistoryService: HaircutHistoryService) {}

  @Get('me')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.haircutHistoryService.findForCustomer(user.id);
  }
}
