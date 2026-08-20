import { Body, Controller, Delete, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { PushDeviceDto, PushDeviceTokenDto } from './dto/push-device.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications/push-devices')
@ApiTags('Bildirimler')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Put()
  register(@CurrentUser() user: AuthenticatedUser, @Body() dto: PushDeviceDto) {
    return this.notificationsService.registerPushDevice(user.id, dto);
  }

  @Delete()
  unregister(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PushDeviceTokenDto,
  ) {
    return this.notificationsService.unregisterPushDevice(
      user.id,
      dto.expoPushToken,
    );
  }
}
