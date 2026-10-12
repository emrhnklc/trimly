import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { ReviewNoShowDto } from './dto/review-no-show.dto';
import { NoShowService } from './no-show.service';

@Controller('moderation/no-show-cases')
@UseGuards(JwtAuthGuard)
export class NoShowModerationController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly noShowService: NoShowService,
  ) {}

  private async assertModerator(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isPlatformModerator: true },
    });
    if (!user?.isPlatformModerator)
      throw new ForbiddenException('Bu işlem için platform yetkisi gerekiyor.');
  }

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    await this.assertModerator(user.id);
    return this.prisma.appointmentNoShowCase.findMany({
      where: { status: 'UNDER_REVIEW' },
      orderBy: { disputedAt: 'asc' },
      select: {
        id: true,
        appointmentId: true,
        customerId: true,
        dependentProfileId: true,
        barbershopId: true,
        markedByUserId: true,
        markedAt: true,
        disputedAt: true,
        disputeReason: true,
      },
    });
  }

  @Patch(':caseId/review')
  async review(
    @Param('caseId') caseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReviewNoShowDto,
  ) {
    await this.assertModerator(user.id);
    return this.noShowService.resolveDispute(
      caseId,
      user.id,
      dto.accepted,
      dto.note,
    );
  }
}
