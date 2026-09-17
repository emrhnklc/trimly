import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
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

  @Get()
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  findInvitations(@Param('barbershopId') barbershopId: string) {
    return this.membersService.findInvitations(barbershopId);
  }

  @Post()
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  createInvitation(
    @Param('barbershopId') barbershopId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.membersService.createInvitation(barbershopId, user.id, dto);
  }

  @Delete(':invitationId')
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  revokeInvitation(
    @Param('barbershopId') barbershopId: string,
    @Param('invitationId') invitationId: string,
  ) {
    return this.membersService.revokeInvitation(barbershopId, invitationId);
  }
}
