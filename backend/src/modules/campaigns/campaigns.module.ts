import { Module } from '@nestjs/common';
import {
  BarbershopCampaignsController,
  CampaignsController,
} from './campaigns.controller';
import { CampaignsService } from './campaigns.service';

@Module({
  controllers: [CampaignsController, BarbershopCampaignsController],
  providers: [CampaignsService],
})
export class CampaignsModule {}
