import { BarbershopAccessMode } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateBarbershopAccessSettingsDto {
  @IsEnum(BarbershopAccessMode)
  accessMode: BarbershopAccessMode;
}
