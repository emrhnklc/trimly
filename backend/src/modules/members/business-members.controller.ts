import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BusinessRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { BusinessRolesGuard } from '../../common/guards/business-roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { ConfirmOwnershipTransferDto } from './dto/confirm-ownership-transfer.dto';
import { UpdateMemberBookableDto } from './dto/update-member-bookable.dto';
import { UpdateBusinessMemberDto } from './dto/update-business-member.dto';
import { MembersService } from './members.service';

@Controller('barbershops/:barbershopId/members')
@ApiTags('Çalışan Yönetimi')
@UseGuards(JwtAuthGuard, BusinessRolesGuard)
export class BusinessMembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  findByBarbershop(@Param('barbershopId') barbershopId: string) {
    return this.membersService.findByBarbershop(barbershopId);
  }

  @Get(':memberId')
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  findOneByBarbershop(
    @Param('barbershopId') barbershopId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.membersService.findOneByBarbershop(barbershopId, memberId);
  }

  @Patch(':memberId')
  @Roles(BusinessRole.OWNER)
  updateMember(
    @Param('barbershopId') barbershopId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateBusinessMemberDto,
  ) {
    return this.membersService.updateMember(barbershopId, memberId, dto);
  }

  @Get(':memberId/appointment-impact')
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  appointmentImpact(
    @Param('barbershopId') barbershopId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.membersService.getAppointmentImpact(barbershopId, memberId);
  }

  @Post(':memberId/ownership-transfer-request')
  @Roles(BusinessRole.OWNER)
  requestOwnershipTransfer(
    @Param('barbershopId') barbershopId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.membersService.requestOwnershipTransfer(
      barbershopId,
      memberId,
      user.id,
    );
  }

  @Post(':memberId/transfer-ownership')
  @Roles(BusinessRole.OWNER)
  confirmOwnershipTransfer(
    @Param('barbershopId') barbershopId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ConfirmOwnershipTransferDto,
  ) {
    return this.membersService.confirmOwnershipTransfer(
      barbershopId,
      memberId,
      user.id,
      dto.code,
    );
  }

  @Put(':memberId/bookable')
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  updateBookable(
    @Param('barbershopId') barbershopId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberBookableDto,
  ) {
    return this.membersService.updateBookable(
      barbershopId,
      memberId,
      dto.isBookable,
      dto.acknowledgeExistingAppointments,
    );
  }

  @Put(':memberId/services/:serviceId')
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  assignService(
    @Param('barbershopId') barbershopId: string,
    @Param('memberId') memberId: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.membersService.assignService(barbershopId, memberId, serviceId);
  }

  @Delete(':memberId/services/:serviceId')
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  unassignService(
    @Param('barbershopId') barbershopId: string,
    @Param('memberId') memberId: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.membersService.unassignService(
      barbershopId,
      memberId,
      serviceId,
    );
  }
}
