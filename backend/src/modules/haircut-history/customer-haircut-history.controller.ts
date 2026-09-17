import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { HaircutHistoryService } from './haircut-history.service';

@Controller('haircut-records')
@ApiTags('Tıraş Geçmişi')
@UseGuards(JwtAuthGuard)
export class CustomerHaircutHistoryController {
  constructor(private readonly haircutHistoryService: HaircutHistoryService) {}

  @Get('me')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.haircutHistoryService.findForCustomer(user.id);
  }

  @Get(':recordId/photos/:photoId')
  async getPhoto(
    @Param('recordId') recordId: string,
    @Param('photoId') photoId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() response: Response,
  ) {
    const photo = await this.haircutHistoryService.getPhotoForCustomer(
      recordId,
      photoId,
      user.id,
    );

    response.setHeader('Content-Type', photo.mimeType);
    response.setHeader('Content-Length', photo.buffer.length);
    response.setHeader('Content-Disposition', 'inline');
    response.send(photo.buffer);
  }

  @Post('appointments/:appointmentId/photos')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  addPhoto(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.haircutHistoryService.addPhotoForCustomer(
      appointmentId,
      user.id,
      file,
    );
  }
}
