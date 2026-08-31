import {
  Body,
  Controller,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
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
}
