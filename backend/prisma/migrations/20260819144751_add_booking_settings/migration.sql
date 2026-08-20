-- AlterTable
ALTER TABLE "BusinessMember" ADD COLUMN     "isBookable" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "BookingSettings" (
    "id" TEXT NOT NULL,
    "barbershopId" TEXT NOT NULL,
    "minBookingNoticeMinutes" INTEGER NOT NULL DEFAULT 60,
    "maxBookingAdvanceDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingSettings_barbershopId_key" ON "BookingSettings"("barbershopId");

-- AddForeignKey
ALTER TABLE "BookingSettings" ADD CONSTRAINT "BookingSettings_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
