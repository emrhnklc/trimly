import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
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
    @Res({ passthrough: true }) response: Response,
  ) {
    const photo = await this.haircutHistoryService.getPhotoForCustomer(
      recordId,
      photoId,
      user.id,
    );

    response.setHeader('Content-Type', photo.mimeType);
    response.setHeader('Content-Length', photo.buffer.length);
    response.setHeader('Content-Disposition', 'inline');
    return photo.buffer;
  }
}
