import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  Matches,
  ValidateIf,
} from 'class-validator';
import {
  CampaignDiscountType,
  CampaignLoyaltyPeriod,
  CampaignRewardType,
  CampaignType,
} from '@prisma/client';

function trimString(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeAmount(value: unknown) {
  return typeof value === 'string' ? value.replace(',', '.') : value;
}

export class UpdateCampaignDto {
  @IsOptional()
  @Transform(({ value }) => trimString(value as unknown))
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @Transform(({ value }) => trimString(value as unknown))
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsEnum(CampaignType)
  campaignType?: CampaignType;

  @IsOptional()
  @IsEnum(CampaignRewardType)
  rewardType?: CampaignRewardType;

  @IsOptional()
  @IsEnum(CampaignDiscountType)
  discountType?: CampaignDiscountType;

  @IsOptional()
  @Transform(({ value }) => normalizeAmount(value as unknown))
  @Matches(/^\d+(?:\.\d{1,2})?$/)
  discountValue?: string;

  @IsOptional()
  @Transform(({ value }) => trimString(value as unknown))
  @IsString()
  @MinLength(2)
  @MaxLength(140)
  giftDescription?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  requiredCompletedVisits?: number | null;

  @IsOptional()
  @IsEnum(CampaignLoyaltyPeriod)
  loyaltyPeriod?: CampaignLoyaltyPeriod | null;

  @IsOptional()
  @ValidateIf(
    (dto: UpdateCampaignDto) =>
      dto.loyaltyPeriod === CampaignLoyaltyPeriod.ROLLING_DAYS,
  )
  @IsInt()
  @Min(1)
  @Max(365)
  rollingPeriodDays?: number | null;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsString({ each: true })
  serviceIds?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  perCustomerLimit?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
