CREATE TABLE "BarbershopPhoto" (
    "id" TEXT NOT NULL,
    "barbershopId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BarbershopPhoto_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BarbershopPhoto_storageKey_key" ON "BarbershopPhoto"("storageKey");
CREATE UNIQUE INDEX "BarbershopPhoto_barbershopId_sortOrder_key" ON "BarbershopPhoto"("barbershopId", "sortOrder");
CREATE INDEX "BarbershopPhoto_barbershopId_sortOrder_idx" ON "BarbershopPhoto"("barbershopId", "sortOrder");

ALTER TABLE "BarbershopPhoto" ADD CONSTRAINT "BarbershopPhoto_barbershopId_fkey"
FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
