import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BusinessRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { BusinessRolesGuard } from '../../common/guards/business-roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomersService } from './customers.service';

@Controller('barbershops/:barbershopId/customers')
@ApiTags('İşletme Müşterileri')
@UseGuards(JwtAuthGuard, BusinessRolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  findByBarbershop(@Param('barbershopId') barbershopId: string) {
    return this.customersService.findByBarbershop(barbershopId);
  }
}
