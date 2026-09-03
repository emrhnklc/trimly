import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BusinessRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { BarbershopBookingAccessGuard } from '../../common/guards/barbershop-booking-access.guard';
import { BusinessRolesGuard } from '../../common/guards/business-roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';

@Controller('barbershops/:barbershopId/services')
@ApiTags('Hizmetler')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, BarbershopBookingAccessGuard)
  findActiveByBarbershop(@Param('barbershopId') barbershopId: string) {
    return this.servicesService.findActiveByBarbershop(barbershopId);
  }

  @Get('management')
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  findAllForManagement(@Param('barbershopId') barbershopId: string) {
    return this.servicesService.findAllForManagement(barbershopId);
  }

  @Get('management/:serviceId')
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  findOneForManagement(
    @Param('barbershopId') barbershopId: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.servicesService.findOneForManagement(barbershopId, serviceId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  create(
    @Param('barbershopId') barbershopId: string,
    @Body() dto: CreateServiceDto,
  ) {
    return this.servicesService.create(barbershopId, dto);
  }

  @Patch(':serviceId')
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  update(
    @Param('barbershopId') barbershopId: string,
    @Param('serviceId') serviceId: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(barbershopId, serviceId, dto);
  }
}
