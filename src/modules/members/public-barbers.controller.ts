import { Controller, Get, Param } from '@nestjs/common';
import { MembersService } from './members.service';

@Controller('barbershops/:barbershopId/barbers')
export class PublicBarbersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  findPublicBarbers(@Param('barbershopId') barbershopId: string) {
    return this.membersService.findPublicBarbers(barbershopId);
  }

  @Get(':memberId')
  findPublicBarber(
    @Param('barbershopId') barbershopId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.membersService.findPublicBarber(barbershopId, memberId);
  }
}
