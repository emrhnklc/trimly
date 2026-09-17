import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { BusinessRole } from '@prisma/client';

export class CreateInvitationDto {
  @IsIn([BusinessRole.MANAGER, BusinessRole.BARBER, BusinessRole.APPRENTICE])
  role: BusinessRole;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(168)
  expiresInHours?: number;
}
