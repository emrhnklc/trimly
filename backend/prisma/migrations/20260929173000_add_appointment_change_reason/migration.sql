ALTER TABLE "AppointmentChangeProposal"
ADD COLUMN "reason" TEXT NOT NULL DEFAULT 'İşletme tarafından değişiklik önerildi.';

ALTER TABLE "AppointmentChangeProposal"
ALTER COLUMN "reason" DROP DEFAULT;
