-- AlterTable
ALTER TABLE "BookingSettings" ADD COLUMN     "cancellationNoticeMinutes" INTEGER NOT NULL DEFAULT 120,
ADD COLUMN     "customerCancellationEnabled" BOOLEAN NOT NULL DEFAULT true;
