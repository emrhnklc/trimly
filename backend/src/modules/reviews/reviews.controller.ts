import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
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
import { UpsertReviewDto } from './dto/upsert-review.dto';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
@ApiTags('Randevu Yorumları')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('barbershops/:barbershopId')
  findForBarbershop(@Param('barbershopId') barbershopId: string) {
    return this.reviewsService.findForBarbershop(barbershopId);
  }

  @Get(':reviewId/photos/:photoId')
  async getPhoto(
    @Param('reviewId') reviewId: string,
    @Param('photoId') photoId: string,
    @Res() response: Response,
  ) {
    const photo = await this.reviewsService.getPhoto(reviewId, photoId);
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    response.setHeader('Content-Type', photo.mimeType);
    response.setHeader('Content-Length', photo.buffer.length);
    response.setHeader('Content-Disposition', 'inline');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.send(photo.buffer);
  }

  @Put('appointments/:appointmentId')
  @UseGuards(JwtAuthGuard)
  upsert(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertReviewDto,
  ) {
    return this.reviewsService.upsert(appointmentId, user.id, dto);
  }

  @Post('appointments/:appointmentId/photos')
  @UseGuards(JwtAuthGuard)
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
    return this.reviewsService.addPhoto(appointmentId, user.id, file);
  }

  @Delete('appointments/:appointmentId/photos/:photoId')
  @UseGuards(JwtAuthGuard)
  removePhoto(
    @Param('appointmentId') appointmentId: string,
    @Param('photoId') photoId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reviewsService.removePhoto(appointmentId, photoId, user.id);
  }

  @Delete('appointments/:appointmentId')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reviewsService.remove(appointmentId, user.id);
  }
}
