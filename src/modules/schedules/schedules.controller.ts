import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { BusinessRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { BusinessRolesGuard } from '../../common/guards/business-roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateMemberWorkingHoursDto } from './dto/update-member-working-hours.dto';
import { UpdateWorkingHoursDto } from './dto/update-working-hours.dto';
import { SchedulesService } from './schedules.service';

@Controller('barbershops/:barbershopId/working-hours')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  findWorkingHours(@Param('barbershopId') barbershopId: string) {
    return this.schedulesService.findWorkingHours(barbershopId);
  }

  @Put()
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  replaceWorkingHours(
    @Param('barbershopId') barbershopId: string,
    @Body() dto: UpdateWorkingHoursDto,
  ) {
    return this.schedulesService.replaceWorkingHours(barbershopId, dto);
  }

  @Get('members/:memberId')
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  findMemberWorkingHours(
    @Param('barbershopId') barbershopId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.schedulesService.findMemberWorkingHours(barbershopId, memberId);
  }

  @Put('members/:memberId')
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  replaceMemberWorkingHours(
    @Param('barbershopId') barbershopId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberWorkingHoursDto,
  ) {
    return this.schedulesService.replaceMemberWorkingHours(
      barbershopId,
      memberId,
      dto,
    );
  }
}
