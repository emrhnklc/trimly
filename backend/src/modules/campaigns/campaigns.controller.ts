import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { memoryStorage } from 'multer';
import { ApiTags } from '@nestjs/swagger';
import { BusinessRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { BarbershopBookingAccessGuard } from '../../common/guards/barbershop-booking-access.guard';
import { BusinessRolesGuard } from '../../common/guards/business-roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@Controller('campaigns')
@ApiTags('Kampanyalar')
@UseGuards(JwtAuthGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  findActivePublic(@CurrentUser() user: AuthenticatedUser) {
    return this.campaignsService.findActivePublic(user.id);
  }
}

@Controller('barbershops/:barbershopId/campaigns')
@ApiTags('Kampanyalar')
export class BarbershopCampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, BarbershopBookingAccessGuard)
  findActive(
    @Param('barbershopId') barbershopId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.campaignsService.findActiveForBarbershop(barbershopId, user.id);
  }

  @Get('management')
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  findForManagement(@Param('barbershopId') barbershopId: string) {
    return this.campaignsService.findForManagement(barbershopId);
  }

  @Get('management/:campaignId')
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  findOneForManagement(
    @Param('barbershopId') barbershopId: string,
    @Param('campaignId') campaignId: string,
  ) {
    return this.campaignsService.findOneForManagement(barbershopId, campaignId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  create(
    @Param('barbershopId') barbershopId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCampaignDto,
  ) {
    return this.campaignsService.create(barbershopId, user.id, dto);
  }

  @Patch(':campaignId')
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  update(
    @Param('barbershopId') barbershopId: string,
    @Param('campaignId') campaignId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaignsService.update(barbershopId, campaignId, user.id, dto);
  }

  @Post(':campaignId/image')
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadImage(
    @Param('barbershopId') barbershopId: string,
    @Param('campaignId') campaignId: string,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() request: Request,
  ) {
    return this.campaignsService.updateImage(
      barbershopId,
      campaignId,
      user.id,
      file,
      publicApiBaseUrl(request),
    );
  }
}

function publicApiBaseUrl(request: Request) {
  const configuredUrl = process.env.PUBLIC_API_URL?.trim();
  if (configuredUrl)
    return configuredUrl.endsWith('/') ? configuredUrl : `${configuredUrl}/`;
  return `${request.protocol}://${request.get('host')}/`;
}
