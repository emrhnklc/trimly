import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RescheduleAppointmentDto {
  @IsDateString()
  startsAt: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(500)
  reason: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  memberId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  serviceId?: string;
}
