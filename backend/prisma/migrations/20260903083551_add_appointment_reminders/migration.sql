-- AlterEnum
ALTER TYPE "AppNotificationType" ADD VALUE 'APPOINTMENT_REMINDER';

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "reminder24hSentAt" TIMESTAMP(3),
ADD COLUMN     "reminder2hSentAt" TIMESTAMP(3);
