import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BusinessRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { BusinessRolesGuard } from '../../common/guards/business-roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { MembersService } from './members.service';

@Controller('barbershops/:barbershopId/invitations')
@ApiTags('Çalışan Davetleri')
@UseGuards(JwtAuthGuard, BusinessRolesGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  createInvitation(
    @Param('barbershopId') barbershopId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.membersService.createInvitation(barbershopId, user.id, dto);
  }
}
