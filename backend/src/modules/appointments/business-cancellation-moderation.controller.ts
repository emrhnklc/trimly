import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { BusinessReliabilityService } from './business-reliability.service';
import { ReviewBusinessCancellationAppealDto } from './dto/review-business-cancellation-appeal.dto';

@Controller('moderation/business-cancellation-appeals')
@UseGuards(JwtAuthGuard)
export class BusinessCancellationModerationController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reliability: BusinessReliabilityService,
  ) {}

  private async assertModerator(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isPlatformModerator: true },
    });
    if (!user?.isPlatformModerator) {
      throw new ForbiddenException('Bu işlem için platform yetkisi gerekiyor.');
    }
  }

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    await this.assertModerator(user.id);
    return this.reliability.listPendingAppeals();
  }

  @Patch(':eventId/review')
  async review(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReviewBusinessCancellationAppealDto,
  ) {
    await this.assertModerator(user.id);
    return this.reliability.reviewAppeal(
      eventId,
      user.id,
      dto.approved,
      dto.note,
      dto.exemptionReason,
    );
  }
}
