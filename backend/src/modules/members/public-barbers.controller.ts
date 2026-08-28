import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MembersService } from './members.service';

@Controller('barbershops/:barbershopId/barbers')
@ApiTags('Genel Berber Profilleri')
export class PublicBarbersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  findPublicBarbers(@Param('barbershopId') barbershopId: string) {
    return this.membersService.findPublicBarbers(barbershopId);
  }
}
