CREATE TYPE "CampaignDiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "barbershopId" TEXT NOT NULL,
    "createdByMemberId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "CampaignDiscountType" NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "usageLimit" INTEGER,
    "perCustomerLimit" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Campaign_discount_value_check" CHECK ("discountValue" > 0),
    CONSTRAINT "Campaign_date_range_check" CHECK ("endsAt" > "startsAt"),
    CONSTRAINT "Campaign_usage_limit_check" CHECK ("usageLimit" IS NULL OR "usageLimit" > 0),
    CONSTRAINT "Campaign_customer_limit_check" CHECK ("perCustomerLimit" > 0),
    CONSTRAINT "Campaign_percentage_check" CHECK ("discountType" <> 'PERCENTAGE' OR "discountValue" <= 100)
);

CREATE TABLE "CampaignService" (
    "campaignId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "CampaignService_pkey" PRIMARY KEY ("campaignId", "serviceId")
);

ALTER TABLE "Appointment" ADD COLUMN "campaignId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "originalPriceSnapshot" DECIMAL(10,2);
ALTER TABLE "Appointment" ADD COLUMN "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;
UPDATE "Appointment" SET "originalPriceSnapshot" = "priceSnapshot";
ALTER TABLE "Appointment" ALTER COLUMN "originalPriceSnapshot" SET NOT NULL;

CREATE INDEX "Campaign_barbershopId_isActive_startsAt_endsAt_idx" ON "Campaign"("barbershopId", "isActive", "startsAt", "endsAt");
CREATE INDEX "Campaign_createdByMemberId_idx" ON "Campaign"("createdByMemberId");
CREATE INDEX "CampaignService_serviceId_idx" ON "CampaignService"("serviceId");
CREATE INDEX "Appointment_campaignId_customerId_status_idx" ON "Appointment"("campaignId", "customerId", "status");

ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_createdByMemberId_fkey" FOREIGN KEY ("createdByMemberId") REFERENCES "BusinessMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CampaignService" ADD CONSTRAINT "CampaignService_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignService" ADD CONSTRAINT "CampaignService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
