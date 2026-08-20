import { Module } from '@nestjs/common';
import { BusinessMembersController } from './business-members.controller';
import { InvitationAcceptanceController } from './invitation-acceptance.controller';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { PublicBarbersController } from './public-barbers.controller';

@Module({
  controllers: [
    MembersController,
    InvitationAcceptanceController,
    BusinessMembersController,
    PublicBarbersController,
  ],
  providers: [MembersService],
})
export class MembersModule {}
