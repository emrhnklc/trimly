import { DevicePlatform } from '@prisma/client';
import { IsEnum, Matches } from 'class-validator';

export class PushDeviceTokenDto {
  @Matches(/^(Expo|Exponent)PushToken\[[^\]]+\]$/)
  expoPushToken: string;
}

export class PushDeviceDto extends PushDeviceTokenDto {
  @IsEnum(DevicePlatform)
  platform: DevicePlatform;
}
