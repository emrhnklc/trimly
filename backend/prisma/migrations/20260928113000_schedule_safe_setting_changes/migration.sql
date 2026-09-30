ALTER TABLE "Barbershop"
  ADD COLUMN "previousWorkingHours" JSONB,
  ADD COLUMN "workingHoursEffectiveFrom" TIMESTAMP(3);

ALTER TABLE "BusinessMember"
  ADD COLUMN "previousWorkingHours" JSONB,
  ADD COLUMN "workingHoursEffectiveFrom" TIMESTAMP(3);

ALTER TABLE "BookingSettings"
  ADD COLUMN "pendingSlotIntervalMinutes" INTEGER,
  ADD COLUMN "slotIntervalEffectiveFrom" TIMESTAMP(3);
