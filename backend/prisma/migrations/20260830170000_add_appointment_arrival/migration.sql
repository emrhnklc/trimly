ALTER TYPE "AppointmentStatus" ADD VALUE 'ARRIVED' AFTER 'CONFIRMED';

ALTER TABLE "Appointment"
ADD COLUMN "arrivedAt" TIMESTAMP(3),
ADD COLUMN "autoCompleteAt" TIMESTAMP(3);

CREATE INDEX "Appointment_status_autoCompleteAt_idx"
ON "Appointment"("status", "autoCompleteAt");
