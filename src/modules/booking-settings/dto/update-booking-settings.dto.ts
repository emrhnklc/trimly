import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateBookingSettingsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10080)
  minBookingNoticeMinutes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(365)
  maxBookingAdvanceDays?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([5, 10, 15, 30])
  slotIntervalMinutes?: number;

  @IsOptional()
  @IsBoolean()
  customerCancellationEnabled?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10080)
  cancellationNoticeMinutes?: number;
}
