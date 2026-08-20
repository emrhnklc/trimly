-- CreateTable
CREATE TABLE "HaircutRecord" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "createdByMemberId" TEXT NOT NULL,
    "styleName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HaircutRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaircutPhoto" (
    "id" TEXT NOT NULL,
    "haircutRecordId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HaircutPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HaircutRecord_appointmentId_key" ON "HaircutRecord"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "HaircutPhoto_storageKey_key" ON "HaircutPhoto"("storageKey");

-- CreateIndex
CREATE INDEX "HaircutPhoto_haircutRecordId_sortOrder_idx" ON "HaircutPhoto"("haircutRecordId", "sortOrder");

-- AddForeignKey
ALTER TABLE "HaircutRecord" ADD CONSTRAINT "HaircutRecord_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaircutRecord" ADD CONSTRAINT "HaircutRecord_createdByMemberId_fkey" FOREIGN KEY ("createdByMemberId") REFERENCES "BusinessMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaircutPhoto" ADD CONSTRAINT "HaircutPhoto_haircutRecordId_fkey" FOREIGN KEY ("haircutRecordId") REFERENCES "HaircutRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
