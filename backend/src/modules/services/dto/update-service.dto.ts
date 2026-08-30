import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateServiceDto {
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  durationMinutes?: number;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(',', '.') : value,
  )
  @Matches(/^\d+(?:\.\d{1,2})?$/)
  price?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
