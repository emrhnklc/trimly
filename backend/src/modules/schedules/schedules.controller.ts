import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BusinessRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { BusinessRolesGuard } from '../../common/guards/business-roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { UpdateMemberWorkingHoursDto } from './dto/update-member-working-hours.dto';
import { UpdateWorkingHoursDto } from './dto/update-working-hours.dto';
import { SchedulesService } from './schedules.service';

@Controller('barbershops/:barbershopId/working-hours')
@ApiTags('Çalışma Saatleri')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  findWorkingHours(
    @Param('barbershopId') barbershopId: string,
    @Query('planned') planned?: string,
  ) {
    return this.schedulesService.findWorkingHours(
      barbershopId,
      planned === 'true',
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  findCurrentMemberWorkingHours(
    @Param('barbershopId') barbershopId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.schedulesService.findCurrentMemberWorkingHours(
      barbershopId,
      user.id,
    );
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
    @Query('planned') planned?: string,
  ) {
    return this.schedulesService.findMemberWorkingHours(
      barbershopId,
      memberId,
      planned === 'true',
    );
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
