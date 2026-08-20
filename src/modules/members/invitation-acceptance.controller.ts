import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { MembersService } from './members.service';

@Controller('invitations')
export class InvitationAcceptanceController {
  constructor(private readonly membersService: MembersService) {}

  @Post(':token/accept')
  @UseGuards(JwtAuthGuard)
  accept(
    @Param('token') token: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.membersService.acceptInvitation(token, user.id);
  }
}
