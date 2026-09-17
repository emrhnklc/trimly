import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
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

export class CreateCampaignDto {
  @Transform(({ value }) => trimString(value as unknown))
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title: string;

  @IsOptional()
  @Transform(({ value }) => trimString(value as unknown))
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsEnum(CampaignType)
  campaignType: CampaignType;

  @IsOptional()
  @IsEnum(CampaignRewardType)
  rewardType?: CampaignRewardType;

  @ValidateIf(
    (dto: CreateCampaignDto) =>
      dto.campaignType === CampaignType.PRICE_DISCOUNT ||
      (dto.campaignType === CampaignType.LOYALTY &&
        dto.rewardType !== CampaignRewardType.GIFT),
  )
  @IsEnum(CampaignDiscountType)
  discountType?: CampaignDiscountType;

  @ValidateIf(
    (dto: CreateCampaignDto) =>
      dto.campaignType === CampaignType.PRICE_DISCOUNT ||
      (dto.campaignType === CampaignType.LOYALTY &&
        dto.rewardType !== CampaignRewardType.GIFT),
  )
  @Transform(({ value }) => normalizeAmount(value as unknown))
  @Matches(/^\d+(?:\.\d{1,2})?$/)
  discountValue?: string;

  @ValidateIf(
    (dto: CreateCampaignDto) =>
      dto.campaignType === CampaignType.GIFT ||
      dto.rewardType === CampaignRewardType.GIFT,
  )
  @Transform(({ value }) => trimString(value as unknown))
  @IsString()
  @MinLength(2)
  @MaxLength(140)
  giftDescription?: string;

  @ValidateIf(
    (dto: CreateCampaignDto) => dto.campaignType === CampaignType.LOYALTY,
  )
  @IsInt()
  @Min(1)
  @Max(20)
  requiredCompletedVisits?: number;

  @ValidateIf(
    (dto: CreateCampaignDto) => dto.campaignType === CampaignType.LOYALTY,
  )
  @IsEnum(CampaignLoyaltyPeriod)
  loyaltyPeriod?: CampaignLoyaltyPeriod;

  @ValidateIf(
    (dto: CreateCampaignDto) =>
      dto.campaignType === CampaignType.LOYALTY &&
      dto.loyaltyPeriod === CampaignLoyaltyPeriod.ROLLING_DAYS,
  )
  @IsInt()
  @Min(1)
  @Max(365)
  rollingPeriodDays?: number;

  @IsDateString()
  startsAt: string;

  @IsDateString()
  endsAt: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsString({ each: true })
  serviceIds: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  perCustomerLimit?: number;
}
