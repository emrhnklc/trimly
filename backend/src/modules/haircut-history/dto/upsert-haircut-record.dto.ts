import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertHaircutRecordDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  styleName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
