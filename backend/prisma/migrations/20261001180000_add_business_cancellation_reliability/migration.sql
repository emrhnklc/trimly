CREATE TYPE "BusinessReliabilityActionType" AS ENUM ('WARNING', 'MEMBER_REVIEW_HOLD', 'DISCOVERY_DEMOTION', 'BOOKING_SUSPENSION', 'MANUAL_REVIEW');

ALTER TYPE "AppNotificationType" ADD VALUE 'APPOINTMENT_BUSINESS_CANCELLED';

CREATE TABLE "BusinessCancellationEvent" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "barbershopId" TEXT NOT NULL,
    "businessMemberId" TEXT NOT NULL,
    "cancelledByUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "cancelledAt" TIMESTAMP(3) NOT NULL,
    "minutesBeforeStart" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BusinessCancellationEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BusinessReliabilityAction" (
    "id" TEXT NOT NULL,
    "type" "BusinessReliabilityActionType" NOT NULL,
    "barbershopId" TEXT NOT NULL,
    "businessMemberId" TEXT,
    "sourceEventId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolvedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BusinessReliabilityAction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BusinessCancellationEvent_appointmentId_key" ON "BusinessCancellationEvent"("appointmentId");
CREATE INDEX "BusinessCancellationEvent_barbershopId_cancelledAt_idx" ON "BusinessCancellationEvent"("barbershopId", "cancelledAt");
CREATE INDEX "BusinessCancellationEvent_businessMemberId_cancelledAt_idx" ON "BusinessCancellationEvent"("businessMemberId", "cancelledAt");
CREATE INDEX "BusinessReliabilityAction_barbershopId_type_endsAt_idx" ON "BusinessReliabilityAction"("barbershopId", "type", "endsAt");
CREATE INDEX "BusinessReliabilityAction_businessMemberId_type_resolvedAt_idx" ON "BusinessReliabilityAction"("businessMemberId", "type", "resolvedAt");
CREATE UNIQUE INDEX "BusinessReliabilityAction_sourceEventId_type_key" ON "BusinessReliabilityAction"("sourceEventId", "type");

ALTER TABLE "BusinessCancellationEvent" ADD CONSTRAINT "BusinessCancellationEvent_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BusinessCancellationEvent" ADD CONSTRAINT "BusinessCancellationEvent_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BusinessCancellationEvent" ADD CONSTRAINT "BusinessCancellationEvent_businessMemberId_fkey" FOREIGN KEY ("businessMemberId") REFERENCES "BusinessMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BusinessReliabilityAction" ADD CONSTRAINT "BusinessReliabilityAction_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BusinessReliabilityAction" ADD CONSTRAINT "BusinessReliabilityAction_businessMemberId_fkey" FOREIGN KEY ("businessMemberId") REFERENCES "BusinessMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BusinessReliabilityAction" ADD CONSTRAINT "BusinessReliabilityAction_sourceEventId_fkey" FOREIGN KEY ("sourceEventId") REFERENCES "BusinessCancellationEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
