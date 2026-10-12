import { BusinessCancellationExemptionReason } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class ReviewBusinessCancellationAppealDto {
  @IsBoolean()
  approved: boolean;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  note: string;

  @ValidateIf((dto: ReviewBusinessCancellationAppealDto) => dto.approved)
  @IsEnum(BusinessCancellationExemptionReason)
  exemptionReason?: BusinessCancellationExemptionReason;
}
