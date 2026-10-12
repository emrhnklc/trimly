CREATE TYPE "NoShowCaseStatus" AS ENUM ('PENDING_DISPUTE', 'UNDER_REVIEW', 'CONFIRMED', 'REVOKED');
CREATE TYPE "BookingRestrictionScope" AS ENUM ('BARBERSHOP', 'PLATFORM');
ALTER TYPE "AppNotificationType" ADD VALUE 'APPOINTMENT_NO_SHOW';

CREATE TABLE "AppointmentNoShowCase" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "dependentProfileId" TEXT,
  "barbershopId" TEXT NOT NULL,
  "markedByUserId" TEXT NOT NULL,
  "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "disputeDeadline" TIMESTAMP(3) NOT NULL,
  "status" "NoShowCaseStatus" NOT NULL DEFAULT 'PENDING_DISPUTE',
  "disputeReason" TEXT,
  "disputedAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3),
  "reviewNote" TEXT,
  "confirmedAt" TIMESTAMP(3),
  CONSTRAINT "AppointmentNoShowCase_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AppointmentNoShowCase_appointmentId_key" ON "AppointmentNoShowCase"("appointmentId");
CREATE INDEX "AppointmentNoShowCase_status_disputeDeadline_idx" ON "AppointmentNoShowCase"("status", "disputeDeadline");
CREATE INDEX "AppointmentNoShowCase_customerId_status_markedAt_idx" ON "AppointmentNoShowCase"("customerId", "status", "markedAt");
CREATE INDEX "AppointmentNoShowCase_barbershopId_customerId_status_markedAt_idx" ON "AppointmentNoShowCase"("barbershopId", "customerId", "status", "markedAt");
ALTER TABLE "AppointmentNoShowCase" ADD CONSTRAINT "AppointmentNoShowCase_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "BookingRestriction" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "barbershopId" TEXT,
  "scope" "BookingRestrictionScope" NOT NULL,
  "sourceCaseId" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BookingRestriction_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BookingRestriction_sourceCaseId_scope_key" ON "BookingRestriction"("sourceCaseId", "scope");
CREATE INDEX "BookingRestriction_customerId_scope_expiresAt_idx" ON "BookingRestriction"("customerId", "scope", "expiresAt");
ALTER TABLE "BookingRestriction" ADD CONSTRAINT "BookingRestriction_sourceCaseId_fkey" FOREIGN KEY ("sourceCaseId") REFERENCES "AppointmentNoShowCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
