import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request, Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { ConfirmAccountDeletionDto } from './dto/confirm-account-deletion.dto';
import { ProfileImageService } from './profile-image.service';
import { UsersService } from './users.service';

@Controller('users')
@ApiTags('Kullanıcı Profili')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly profileImageService: ProfileImageService,
  ) {}

  @Get('me')
  findMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findMe(user.id);
  }

  @Get('me/export')
  exportMyData(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.exportMyData(user.id);
  }

  @Post('me/deletion-request')
  requestDeletion(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.requestAccountDeletion(user.id);
  }

  @Post('me/delete')
  confirmDeletion(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ConfirmAccountDeletionDto,
  ) {
    return this.usersService.confirmAccountDeletion(user.id, dto.code);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateMyProfileDto,
  ) {
    return this.usersService.updateMe(user.id, dto);
  }

  @Post('me/profile-photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadProfilePhoto(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() request: Request,
  ) {
    const publicBaseUrl = publicApiBaseUrl(request);
    const saved = await this.profileImageService.save(file);
    return this.usersService.updateProfilePhoto(
      user.id,
      saved.fileName,
      publicBaseUrl,
    );
  }

  @Delete('me/profile-photo')
  removeProfilePhoto(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.removeProfilePhoto(user.id);
  }
}

@Controller('users/profile-images')
@ApiTags('Kullanıcı Profili')
export class ProfileImagesController {
  constructor(private readonly profileImageService: ProfileImageService) {}

  @Get(':fileName')
  async getProfileImage(
    @Param('fileName') fileName: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const image = await this.profileImageService.read(fileName);
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    response.setHeader('Content-Type', image.mimeType);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    return new StreamableFile(image.buffer);
  }
}

function publicApiBaseUrl(request: Request) {
  const configuredBaseUrl = process.env.PUBLIC_API_URL?.trim();
  if (configuredBaseUrl) return configuredBaseUrl;
  if (process.env.NODE_ENV === 'production') {
    throw new InternalServerErrorException(
      'Profil fotoğrafı yüklemek için PUBLIC_API_URL ayarlanmalıdır.',
    );
  }
  return `${request.protocol}://${request.get('host')}`;
}
