import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateMyProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(25)
  phone?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Doğum tarihi YYYY-MM-DD biçiminde olmalıdır.',
  })
  birthDate?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  provinceCode?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  province?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  neighborhood?: string | null;
}
