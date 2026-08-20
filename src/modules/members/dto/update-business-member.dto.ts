import { BusinessRole } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class UpdateBusinessMemberDto {
  @IsOptional()
  @IsEnum(BusinessRole)
  role?: BusinessRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
