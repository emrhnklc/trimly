import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BarbershopBookingAccessGuard } from '../../common/guards/barbershop-booking-access.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MembersService } from './members.service';
import { MemberProfileService } from './member-profile.service';

@Controller('barbershops/:barbershopId/barbers')
@ApiTags('Genel Berber Profilleri')
export class PublicBarbersController {
  constructor(
    private readonly membersService: MembersService,
    private readonly profiles: MemberProfileService,
  ) {}

  @Get(':memberId')
  @UseGuards(JwtAuthGuard, BarbershopBookingAccessGuard)
  findProfile(
    @Param('barbershopId') shop: string,
    @Param('memberId') member: string,
  ) {
    return this.profiles.findPublic(shop, member);
  }

  @Get()
  @UseGuards(JwtAuthGuard, BarbershopBookingAccessGuard)
  findPublicBarbers(@Param('barbershopId') barbershopId: string) {
    return this.membersService.findPublicBarbers(barbershopId);
  }
}
