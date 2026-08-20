import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { BusinessRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { BusinessRolesGuard } from '../../common/guards/business-roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMemberScheduleBlockDto } from './dto/create-member-schedule-block.dto';
import { SchedulesService } from './schedules.service';

@Controller('barbershops/:barbershopId/members/:memberId/schedule-blocks')
@UseGuards(JwtAuthGuard, BusinessRolesGuard)
export class ScheduleBlocksController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  findUpcoming(
    @Param('barbershopId') barbershopId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.schedulesService.findUpcomingScheduleBlocks(
      barbershopId,
      memberId,
    );
  }

  @Post()
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  create(
    @Param('barbershopId') barbershopId: string,
    @Param('memberId') memberId: string,
    @Body() dto: CreateMemberScheduleBlockDto,
  ) {
    return this.schedulesService.createMemberScheduleBlock(
      barbershopId,
      memberId,
      dto,
    );
  }
}
