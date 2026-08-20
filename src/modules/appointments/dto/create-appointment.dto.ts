import { IsDateString, IsString, MinLength } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  @MinLength(1)
  memberId: string;

  @IsString()
  @MinLength(1)
  serviceId: string;

  @IsDateString()
  startsAt: string;
}
