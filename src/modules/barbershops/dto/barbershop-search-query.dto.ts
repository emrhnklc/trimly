import { IsOptional, IsString, MaxLength } from 'class-validator';

export class BarbershopSearchQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
