CREATE TYPE "BusinessCancellationPointReason" AS ENUM (
    'MORE_THAN_24_HOURS',
    'BETWEEN_2_AND_24_HOURS',
    'LESS_THAN_2_HOURS',
    'AFTER_START',
    'CUSTOMER_ARRIVED'
);

ALTER TABLE "BusinessCancellationEvent"
ADD COLUMN "pointReason" "BusinessCancellationPointReason";

UPDATE "BusinessCancellationEvent"
SET "pointReason" = CASE
    WHEN "minutesBeforeStart" <= 0 THEN 'AFTER_START'::"BusinessCancellationPointReason"
    WHEN "points" = 3 THEN 'CUSTOMER_ARRIVED'::"BusinessCancellationPointReason"
    WHEN "points" = 2 THEN 'LESS_THAN_2_HOURS'::"BusinessCancellationPointReason"
    WHEN "points" = 1 THEN 'BETWEEN_2_AND_24_HOURS'::"BusinessCancellationPointReason"
    ELSE 'MORE_THAN_24_HOURS'::"BusinessCancellationPointReason"
END;

ALTER TABLE "BusinessCancellationEvent"
ALTER COLUMN "pointReason" SET NOT NULL;

ALTER TYPE "AppNotificationType" ADD VALUE 'BUSINESS_RELIABILITY_POINTS_ADDED';
