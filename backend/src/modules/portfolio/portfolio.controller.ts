import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { RequestPortfolioPublicationDto } from './dto/request-portfolio-publication.dto';
import { PortfolioService } from './portfolio.service';

@Controller('portfolio')
@ApiTags('Berber Portföyü')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('barbershops/:barbershopId')
  findPublic(@Param('barbershopId') barbershopId: string) {
    return this.portfolioService.findPublicForBarbershop(barbershopId);
  }

  @Get('items/:itemId/image')
  async getPublicImage(
    @Param('itemId') itemId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const image = await this.portfolioService.getPublicImage(itemId);
    response.setHeader('Cache-Control', 'public, max-age=3600');
    response.setHeader('Content-Type', image.mimeType);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    return new StreamableFile(image.buffer);
  }

  @Post(
    'barbershops/:barbershopId/appointments/:appointmentId/photos/:photoId/request',
  )
  @UseGuards(JwtAuthGuard)
  requestPublication(
    @Param('barbershopId') barbershopId: string,
    @Param('appointmentId') appointmentId: string,
    @Param('photoId') photoId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RequestPortfolioPublicationDto,
  ) {
    return this.portfolioService.requestPublication(
      barbershopId,
      appointmentId,
      photoId,
      user.id,
      dto.title,
    );
  }

  @Patch('requests/:itemId/approve')
  @UseGuards(JwtAuthGuard)
  approve(
    @Param('itemId') itemId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.portfolioService.approve(itemId, user.id);
  }

  @Patch('requests/:itemId/reject')
  @UseGuards(JwtAuthGuard)
  reject(
    @Param('itemId') itemId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.portfolioService.reject(itemId, user.id);
  }

  @Patch('requests/:itemId/revoke')
  @UseGuards(JwtAuthGuard)
  revoke(
    @Param('itemId') itemId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.portfolioService.revoke(itemId, user.id);
  }
}
