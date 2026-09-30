import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request, Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { BusinessRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { BusinessRolesGuard } from '../../common/guards/business-roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { BarbershopReadinessService } from './barbershop-readiness.service';
import { BarbershopsService } from './barbershops.service';
import { BarbershopSearchQueryDto } from './dto/barbershop-search-query.dto';
import { CreateBarbershopDto } from './dto/create-barbershop.dto';
import { RedeemBarbershopAccessDto } from './dto/redeem-barbershop-access.dto';
import { UpdateBarbershopAccessSettingsDto } from './dto/update-barbershop-access-settings.dto';
import { UpdateBarbershopProfileDto } from './dto/update-barbershop-profile.dto';

@Controller('barbershops')
@ApiTags('İşletmeler')
export class BarbershopsController {
  constructor(
    private readonly barbershopsService: BarbershopsService,
    private readonly barbershopReadinessService: BarbershopReadinessService,
  ) {}

  @Get()
  findPublic(@Query() query: BarbershopSearchQueryDto) {
    return this.barbershopsService.findPublic(query);
  }

  @Get('slug-availability/:slug')
  getSlugAvailability(@Param('slug') slug: string) {
    return this.barbershopsService.getSlugAvailability(slug);
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

  @Get(':barbershopId/customer-accesses')
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  getCustomerAccesses(@Param('barbershopId') barbershopId: string) {
    return this.barbershopsService.getCustomerAccesses(barbershopId);
  }

  @Get(':barbershopId/readiness')
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  getReadiness(@Param('barbershopId') barbershopId: string) {
    return this.barbershopReadinessService.getReadiness(barbershopId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBarbershopDto,
  ) {
    return this.barbershopsService.create(user.id, dto);
  }

  @Post('onboarding')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'profilePhoto', maxCount: 1 },
        { name: 'galleryPhotos', maxCount: 8 },
      ],
      {
        storage: memoryStorage(),
        limits: { fileSize: 5 * 1024 * 1024, files: 9 },
      },
    ),
  )
  createWithPhotos(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBarbershopDto,
    @UploadedFiles()
    files: {
      profilePhoto?: Express.Multer.File[];
      galleryPhotos?: Express.Multer.File[];
    },
    @Req() request: Request,
  ) {
    return this.barbershopsService.createWithPhotos(
      user.id,
      dto,
      files.profilePhoto?.[0],
      files.galleryPhotos ?? [],
      publicApiBaseUrl(request),
    );
  }

  @Get('images/:fileName')
  async getImage(
    @Param('fileName') fileName: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const image = await this.barbershopsService.getImage(fileName);
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    response.setHeader('Content-Type', image.mimeType);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    return new StreamableFile(image.buffer);
  }

  @Post(':slug/access')
  @Throttle({ default: { ttl: 15 * 60_000, limit: 8 } })
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

  @Post(':barbershopId/profile-photo')
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadProfilePhoto(
    @Param('barbershopId') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() request: Request,
  ) {
    return this.barbershopsService.updateProfileImage(
      id,
      file,
      publicApiBaseUrl(request),
    );
  }

  @Post(':barbershopId/cover-photo')
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadCoverPhoto(
    @Param('barbershopId') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() request: Request,
  ) {
    return this.barbershopsService.updateCoverImage(
      id,
      file,
      publicApiBaseUrl(request),
    );
  }

  @Post(':barbershopId/gallery-photos')
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'files', maxCount: 8 }], {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024, files: 8 },
    }),
  )
  uploadGalleryPhotos(
    @Param('barbershopId') id: string,
    @UploadedFiles() files: { files?: Express.Multer.File[] },
    @Req() request: Request,
  ) {
    return this.barbershopsService.addGalleryImages(
      id,
      files.files ?? [],
      publicApiBaseUrl(request),
    );
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
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  rotateAccessCode(@Param('barbershopId') barbershopId: string) {
    return this.barbershopsService.rotateAccessCode(barbershopId);
  }

  @Delete(':barbershopId/customer-accesses/:customerId')
  @UseGuards(JwtAuthGuard, BusinessRolesGuard)
  @Roles(BusinessRole.OWNER, BusinessRole.MANAGER)
  revokeCustomerAccess(
    @Param('barbershopId') barbershopId: string,
    @Param('customerId') customerId: string,
  ) {
    return this.barbershopsService.revokeCustomerAccess(
      barbershopId,
      customerId,
    );
  }
}

function publicApiBaseUrl(request: Request) {
  const configured = process.env.PUBLIC_API_URL?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV === 'production')
    throw new InternalServerErrorException(
      'İşletme fotoğrafları için PUBLIC_API_URL ayarlanmalıdır.',
    );
  return `${request.protocol}://${request.get('host')}`;
}
