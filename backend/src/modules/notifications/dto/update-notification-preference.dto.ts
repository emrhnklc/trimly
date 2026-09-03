import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferenceDto {
  @IsBoolean()
  @IsOptional()
  appointmentRemindersEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  campaignsEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  recommendationsEnabled?: boolean;
}
