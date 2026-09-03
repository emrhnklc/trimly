import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
import { BarbershopsService } from './barbershops.service';
import { BarbershopSearchQueryDto } from './dto/barbershop-search-query.dto';
import { CreateBarbershopDto } from './dto/create-barbershop.dto';
import { RedeemBarbershopAccessDto } from './dto/redeem-barbershop-access.dto';
import { UpdateBarbershopAccessSettingsDto } from './dto/update-barbershop-access-settings.dto';
import { UpdateBarbershopProfileDto } from './dto/update-barbershop-profile.dto';

@Controller('barbershops')
@ApiTags('İşletmeler')
export class BarbershopsController {
  constructor(private readonly barbershopsService: BarbershopsService) {}

  @Get()
  findPublic(@Query() query: BarbershopSearchQueryDto) {
    return this.barbershopsService.findPublic(query.search);
  }

  @Get(':slug')
  findPublicBySlug(@Param('slug') slug: string) {
    return this.barbershopsService.findPublicBySlug(slug);
  }

  @Get(':barbershopId/access-settings')
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  getAccessSettings(@Param('barbershopId') barbershopId: string) {
    return this.barbershopsService.getAccessSettings(barbershopId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBarbershopDto,
  ) {
    return this.barbershopsService.create(user.id, dto);
  }

  @Post(':slug/access')
  @UseGuards(JwtAuthGuard)
  redeemCustomerAccess(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slug') slug: string,
    @Body() dto: RedeemBarbershopAccessDto,
  ) {
    return this.barbershopsService.redeemCustomerAccess(user.id, slug, dto);
  }

  @Patch(':barbershopId')
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  updateProfile(
    @Param('barbershopId') barbershopId: string,
    @Body() dto: UpdateBarbershopProfileDto,
  ) {
    return this.barbershopsService.updateProfile(barbershopId, dto);
  }

  @Patch(':barbershopId/access-settings')
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  updateAccessSettings(
    @Param('barbershopId') barbershopId: string,
    @Body() dto: UpdateBarbershopAccessSettingsDto,
  ) {
    return this.barbershopsService.updateAccessSettings(barbershopId, dto);
  }

  @Post(':barbershopId/access-code/rotate')
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  rotateAccessCode(@Param('barbershopId') barbershopId: string) {
    return this.barbershopsService.rotateAccessCode(barbershopId);
  }
}
