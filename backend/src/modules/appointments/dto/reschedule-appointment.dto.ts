import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsDateString()
  startsAt: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  memberId?: string;
}
