import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  @MinLength(1)
  memberId: string;

  @IsString()
  @MinLength(1)
  serviceId: string;

  @IsDateString()
  startsAt: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  campaignId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  dependentProfileId?: string;
}
