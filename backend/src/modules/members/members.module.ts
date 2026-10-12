import { Module } from '@nestjs/common';
import { BusinessMembersController } from './business-members.controller';
import { InvitationAcceptanceController } from './invitation-acceptance.controller';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { PublicBarbersController } from './public-barbers.controller';
import { MemberProfileService } from './member-profile.service';

@Module({
  controllers: [
    MembersController,
    InvitationAcceptanceController,
    BusinessMembersController,
    PublicBarbersController,
  ],
  providers: [MembersService, MemberProfileService],
})
export class MembersModule {}
