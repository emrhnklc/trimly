import { IsString, Matches, MinLength } from 'class-validator';

export class AvailabilityQueryDto {
  @IsString()
  @MinLength(1)
  memberId: string;

  @IsString()
  @MinLength(1)
  serviceId: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;
}
