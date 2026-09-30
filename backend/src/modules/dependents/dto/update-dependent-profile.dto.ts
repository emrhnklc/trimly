import { DependentRelationship } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
  MinLength,
} from 'class-validator';

function trimString(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export class UpdateDependentProfileDto {
  @IsOptional()
  @Transform(({ value }) => trimString(value as unknown))
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @Transform(({ value }) => trimString(value as unknown))
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsEnum(DependentRelationship)
  relationship?: DependentRelationship;

  @IsOptional()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  birthDate?: string;

  @IsOptional()
  @Transform(({ value }) => trimString(value as unknown))
  @IsString()
  @MaxLength(500)
  notes?: string;
}
