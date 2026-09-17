CREATE TABLE "AppointmentReview" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "barbershopId" TEXT NOT NULL,
    "businessMemberId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentReview_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AppointmentReview_rating_check" CHECK ("rating" BETWEEN 1 AND 5)
);

CREATE TABLE "ReviewPhoto" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewPhoto_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AppointmentReview_appointmentId_key" ON "AppointmentReview"("appointmentId");
CREATE INDEX "AppointmentReview_barbershopId_createdAt_idx" ON "AppointmentReview"("barbershopId", "createdAt");
CREATE INDEX "AppointmentReview_businessMemberId_createdAt_idx" ON "AppointmentReview"("businessMemberId", "createdAt");
CREATE INDEX "AppointmentReview_customerId_createdAt_idx" ON "AppointmentReview"("customerId", "createdAt");
CREATE UNIQUE INDEX "ReviewPhoto_storageKey_key" ON "ReviewPhoto"("storageKey");
CREATE UNIQUE INDEX "ReviewPhoto_reviewId_sortOrder_key" ON "ReviewPhoto"("reviewId", "sortOrder");
CREATE INDEX "ReviewPhoto_reviewId_sortOrder_idx" ON "ReviewPhoto"("reviewId", "sortOrder");

ALTER TABLE "AppointmentReview" ADD CONSTRAINT "AppointmentReview_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AppointmentReview" ADD CONSTRAINT "AppointmentReview_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AppointmentReview" ADD CONSTRAINT "AppointmentReview_businessMemberId_fkey" FOREIGN KEY ("businessMemberId") REFERENCES "BusinessMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AppointmentReview" ADD CONSTRAINT "AppointmentReview_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewPhoto" ADD CONSTRAINT "ReviewPhoto_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "AppointmentReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
