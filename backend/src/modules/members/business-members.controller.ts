import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BusinessRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { BusinessRolesGuard } from '../../common/guards/business-roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
