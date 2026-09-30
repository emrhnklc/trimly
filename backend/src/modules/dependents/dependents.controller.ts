import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { DependentsService } from './dependents.service';
import { CreateDependentProfileDto } from './dto/create-dependent-profile.dto';
import { UpdateDependentProfileDto } from './dto/update-dependent-profile.dto';

@Controller('dependents')
@ApiTags('Yakın Profilleri')
@UseGuards(JwtAuthGuard)
export class DependentsController {
  constructor(private readonly dependentsService: DependentsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.dependentsService.list(user.id);
  }

  @Get(':dependentId')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('dependentId') dependentId: string,
  ) {
    return this.dependentsService.findOne(user.id, dependentId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDependentProfileDto,
  ) {
    return this.dependentsService.create(user.id, dto);
  }

  @Patch(':dependentId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('dependentId') dependentId: string,
    @Body() dto: UpdateDependentProfileDto,
  ) {
    return this.dependentsService.update(user.id, dependentId, dto);
  }

  @Delete(':dependentId')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('dependentId') dependentId: string,
  ) {
    return this.dependentsService.remove(user.id, dependentId);
  }
}
