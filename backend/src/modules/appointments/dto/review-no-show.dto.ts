import { Transform } from 'class-transformer';
import { IsBoolean, IsString, MaxLength, MinLength } from 'class-validator';

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class ReviewNoShowDto {
  @IsBoolean()
  accepted: boolean;

  @Transform(({ value }) => trimString(value as unknown))
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  note: string;
}
