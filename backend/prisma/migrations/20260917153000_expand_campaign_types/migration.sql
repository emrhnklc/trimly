CREATE TYPE "CampaignType" AS ENUM ('PRICE_DISCOUNT', 'GIFT', 'LOYALTY');
CREATE TYPE "CampaignRewardType" AS ENUM ('DISCOUNT', 'GIFT');
CREATE TYPE "CampaignLoyaltyPeriod" AS ENUM ('CALENDAR_MONTH', 'ROLLING_DAYS');

ALTER TABLE "Campaign"
  ADD COLUMN "campaignType" "CampaignType" NOT NULL DEFAULT 'PRICE_DISCOUNT',
  ADD COLUMN "rewardType" "CampaignRewardType" NOT NULL DEFAULT 'DISCOUNT',
  ADD COLUMN "giftDescription" TEXT,
  ADD COLUMN "requiredCompletedVisits" INTEGER,
  ADD COLUMN "loyaltyPeriod" "CampaignLoyaltyPeriod",
  ADD COLUMN "rollingPeriodDays" INTEGER,
  ADD COLUMN "imageUrl" TEXT,
  ALTER COLUMN "discountType" DROP NOT NULL,
  ALTER COLUMN "discountValue" DROP NOT NULL;

ALTER TABLE "Campaign"
  ADD CONSTRAINT "Campaign_required_visits_check" CHECK ("requiredCompletedVisits" IS NULL OR "requiredCompletedVisits" > 0),
  ADD CONSTRAINT "Campaign_rolling_days_check" CHECK ("rollingPeriodDays" IS NULL OR "rollingPeriodDays" > 0);

ALTER TABLE "Appointment"
  ADD COLUMN "campaignTitleSnapshot" TEXT,
  ADD COLUMN "campaignBenefitSnapshot" TEXT;
