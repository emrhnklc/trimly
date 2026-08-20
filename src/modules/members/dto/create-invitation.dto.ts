import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { BusinessRole } from '@prisma/client';

export class CreateInvitationDto {
  @IsEnum(BusinessRole)
  role: BusinessRole;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(168)
  expiresInHours?: number;
}
