import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CancelAppointmentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(500)
  reason: string;
}
