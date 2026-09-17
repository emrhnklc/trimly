CREATE TABLE "OwnershipTransferChallenge" (
  "id" TEXT NOT NULL,
  "currentOwnerId" TEXT NOT NULL,
  "barbershopId" TEXT NOT NULL,
  "targetMemberId" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OwnershipTransferChallenge_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "OwnershipTransferChallenge"
  ADD CONSTRAINT "OwnershipTransferChallenge_currentOwnerId_fkey"
  FOREIGN KEY ("currentOwnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "OwnershipTransferChallenge_currentOwnerId_barbershopId_createdAt_idx"
  ON "OwnershipTransferChallenge"("currentOwnerId", "barbershopId", "createdAt");
CREATE INDEX "OwnershipTransferChallenge_expiresAt_idx"
  ON "OwnershipTransferChallenge"("expiresAt");
