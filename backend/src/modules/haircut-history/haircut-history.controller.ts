import {
  Body,
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
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { AddHaircutPhotoDto } from './dto/add-haircut-photo.dto';
import { UpsertHaircutRecordDto } from './dto/upsert-haircut-record.dto';
import { HaircutHistoryService } from './haircut-history.service';

@Controller(
  'barbershops/:barbershopId/appointments/:appointmentId/haircut-record',
)
@ApiTags('Tıraş Geçmişi')
@UseGuards(JwtAuthGuard)
export class HaircutHistoryController {
  constructor(private readonly haircutHistoryService: HaircutHistoryService) {}

  @Post()
  upsert(
    @Param('barbershopId') barbershopId: string,
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertHaircutRecordDto,
  ) {
    return this.haircutHistoryService.upsertForAppointment(
      barbershopId,
      appointmentId,
      user.id,
      dto,
    );
  }

  @Post('photos')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  addPhoto(
    @Param('barbershopId') barbershopId: string,
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddHaircutPhotoDto,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.haircutHistoryService.addPhotoForAppointment(
      barbershopId,
      appointmentId,
      user.id,
      dto.customerConsentConfirmed,
      file,
    );
  }

  @Post('finalize')
  finalize(
    @Param('barbershopId') barbershopId: string,
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.haircutHistoryService.finalizeForAppointment(
      barbershopId,
      appointmentId,
      user.id,
    );
  }

  @Get('photos/:photoId')
  async getPhoto(
    @Param('barbershopId') barbershopId: string,
    @Param('appointmentId') appointmentId: string,
    @Param('photoId') photoId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() response: Response,
  ) {
    const photo = await this.haircutHistoryService.getPhotoForBusiness(
      barbershopId,
      appointmentId,
      photoId,
      user.id,
    );

    response.setHeader('Content-Type', photo.mimeType);
    response.setHeader('Content-Length', photo.buffer.length);
    response.setHeader('Content-Disposition', 'inline');
    response.send(photo.buffer);
  }
}
