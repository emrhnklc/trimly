CREATE TYPE "AppointmentChangeProposalStatus" AS ENUM (
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'EXPIRED',
  'CANCELLED'
);

ALTER TYPE "AppNotificationType" ADD VALUE 'APPOINTMENT_CHANGE_PROPOSAL';

CREATE TABLE "AppointmentChangeProposal" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "createdByMemberId" TEXT NOT NULL,
  "proposedBusinessMemberId" TEXT NOT NULL,
  "proposedServiceId" TEXT NOT NULL,
  "proposedServiceName" TEXT NOT NULL,
  "proposedStartsAt" TIMESTAMP(3) NOT NULL,
  "proposedEndsAt" TIMESTAMP(3) NOT NULL,
  "proposedDurationMinutes" INTEGER NOT NULL,
  "proposedPrice" DECIMAL(10,2) NOT NULL,
  "status" "AppointmentChangeProposalStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "respondedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AppointmentChangeProposal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AppointmentChangeProposal_appointmentId_status_idx"
ON "AppointmentChangeProposal"("appointmentId", "status");

CREATE INDEX "AppointmentChangeProposal_expiresAt_status_idx"
ON "AppointmentChangeProposal"("expiresAt", "status");

CREATE UNIQUE INDEX "AppointmentChangeProposal_one_pending_per_appointment_idx"
ON "AppointmentChangeProposal"("appointmentId")
WHERE "status" = 'PENDING';

ALTER TABLE "AppointmentChangeProposal"
ADD CONSTRAINT "AppointmentChangeProposal_appointmentId_fkey"
FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AppointmentChangeProposal"
ADD CONSTRAINT "AppointmentChangeProposal_createdByMemberId_fkey"
FOREIGN KEY ("createdByMemberId") REFERENCES "BusinessMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AppointmentChangeProposal"
ADD CONSTRAINT "AppointmentChangeProposal_proposedBusinessMemberId_fkey"
FOREIGN KEY ("proposedBusinessMemberId") REFERENCES "BusinessMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AppointmentChangeProposal"
ADD CONSTRAINT "AppointmentChangeProposal_proposedServiceId_fkey"
FOREIGN KEY ("proposedServiceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
