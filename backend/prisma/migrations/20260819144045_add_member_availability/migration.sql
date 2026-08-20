-- CreateEnum
CREATE TYPE "ScheduleBlockType" AS ENUM ('BREAK', 'TIME_OFF');

-- AlterTable
ALTER TABLE "Barbershop" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Europe/Istanbul';

-- CreateTable
CREATE TABLE "MemberWorkingHours" (
    "id" TEXT NOT NULL,
    "businessMemberId" TEXT NOT NULL,
    "weekday" "Weekday" NOT NULL,
    "startTime" VARCHAR(5) NOT NULL,
    "endTime" VARCHAR(5) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberWorkingHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberScheduleBlock" (
    "id" TEXT NOT NULL,
    "businessMemberId" TEXT NOT NULL,
    "type" "ScheduleBlockType" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberScheduleBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberWorkingHours_businessMemberId_weekday_key" ON "MemberWorkingHours"("businessMemberId", "weekday");

-- CreateIndex
CREATE INDEX "MemberScheduleBlock_businessMemberId_startsAt_endsAt_idx" ON "MemberScheduleBlock"("businessMemberId", "startsAt", "endsAt");

-- AddForeignKey
ALTER TABLE "MemberWorkingHours" ADD CONSTRAINT "MemberWorkingHours_businessMemberId_fkey" FOREIGN KEY ("businessMemberId") REFERENCES "BusinessMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberScheduleBlock" ADD CONSTRAINT "MemberScheduleBlock_businessMemberId_fkey" FOREIGN KEY ("businessMemberId") REFERENCES "BusinessMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
