-- AlterTable
ALTER TABLE "BookingSettings" ADD COLUMN     "slotIntervalMinutes" INTEGER NOT NULL DEFAULT 5;

ALTER TABLE "BookingSettings"
ADD CONSTRAINT "BookingSettings_slot_interval_allowed"
CHECK ("slotIntervalMinutes" IN (5, 10, 15, 30));
