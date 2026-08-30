import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateBarbershopProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @ValidateIf((_, value: unknown) => value !== '')
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  profileImageUrl?: string;

  @IsOptional()
  @ValidateIf((_, value: unknown) => value !== '')
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  coverImageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsBoolean()
  isDiscoverable?: boolean;
}
