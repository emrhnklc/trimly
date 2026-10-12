CREATE TYPE "BusinessCancellationAppealStatus" AS ENUM ('NOT_REQUESTED', 'PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "BusinessCancellationExemptionReason" AS ENUM ('PLATFORM_OUTAGE', 'FORCE_MAJEURE', 'VERIFIED_ERROR');

ALTER TABLE "BusinessCancellationEvent"
  ADD COLUMN "appealReason" TEXT,
  ADD COLUMN "appealRequestedAt" TIMESTAMP(3),
  ADD COLUMN "appealRequestedByUserId" TEXT,
  ADD COLUMN "appealReviewNote" TEXT,
  ADD COLUMN "appealReviewedAt" TIMESTAMP(3),
  ADD COLUMN "appealReviewedByUserId" TEXT,
  ADD COLUMN "appealStatus" "BusinessCancellationAppealStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
  ADD COLUMN "exemptionReason" "BusinessCancellationExemptionReason";

ALTER TABLE "BusinessReliabilityAction" ADD COLUMN "thresholdPoints" INTEGER;

UPDATE "BusinessReliabilityAction"
SET "thresholdPoints" = CASE
  WHEN "type" = 'WARNING' THEN 3
  WHEN "type" IN ('MEMBER_REVIEW_HOLD', 'DISCOVERY_DEMOTION') THEN 5
  WHEN "type" = 'BOOKING_SUSPENSION' AND "endsAt" - "startsAt" >= INTERVAL '7 days' THEN 16
  WHEN "type" = 'BOOKING_SUSPENSION' THEN 8
  WHEN "type" = 'MANUAL_REVIEW' THEN 16
END;

CREATE INDEX "BusinessCancellationEvent_appealStatus_appealRequestedAt_idx"
  ON "BusinessCancellationEvent"("appealStatus", "appealRequestedAt");
