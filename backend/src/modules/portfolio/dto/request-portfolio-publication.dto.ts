import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestPortfolioPublicationDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  title?: string;
}
