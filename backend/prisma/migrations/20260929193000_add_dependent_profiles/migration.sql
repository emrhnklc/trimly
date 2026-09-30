CREATE TYPE "DependentRelationship" AS ENUM ('CHILD', 'SIBLING', 'DEPENDENT');

CREATE TABLE "DependentProfile" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "relationship" "DependentRelationship" NOT NULL,
    "birthDate" DATE NOT NULL,
    "notes" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DependentProfile_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Appointment"
ADD COLUMN "dependentProfileId" TEXT,
ADD COLUMN "attendeeNameSnapshot" TEXT,
ADD COLUMN "appointmentLocalDate" DATE;

UPDATE "Appointment" AS appointment
SET
  "attendeeNameSnapshot" = CONCAT(customer."firstName", ' ', customer."lastName"),
  "appointmentLocalDate" = (appointment."startsAt" AT TIME ZONE barbershop."timezone")::date
FROM "User" AS customer, "Barbershop" AS barbershop
WHERE customer."id" = appointment."customerId"
  AND barbershop."id" = appointment."barbershopId";

ALTER TABLE "Appointment"
ALTER COLUMN "attendeeNameSnapshot" SET NOT NULL,
ALTER COLUMN "appointmentLocalDate" SET NOT NULL;

CREATE INDEX "DependentProfile_ownerId_archivedAt_idx"
ON "DependentProfile"("ownerId", "archivedAt");

CREATE INDEX "Appointment_customerId_appointmentLocalDate_idx"
ON "Appointment"("customerId", "appointmentLocalDate");

CREATE INDEX "Appointment_dependentProfileId_appointmentLocalDate_idx"
ON "Appointment"("dependentProfileId", "appointmentLocalDate");

ALTER TABLE "DependentProfile"
ADD CONSTRAINT "DependentProfile_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Appointment"
ADD CONSTRAINT "Appointment_dependentProfileId_fkey"
FOREIGN KEY ("dependentProfileId") REFERENCES "DependentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
