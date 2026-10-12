import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateMemberBookableDto {
  @IsBoolean()
  isBookable: boolean;

  @IsOptional()
  @IsBoolean()
  acknowledgeExistingAppointments?: boolean;
}
