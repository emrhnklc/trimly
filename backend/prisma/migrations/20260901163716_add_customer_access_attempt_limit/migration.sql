-- CreateTable
CREATE TABLE "CustomerBarbershopAccessAttempt" (
    "userId" TEXT NOT NULL,
    "barbershopId" TEXT NOT NULL,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "windowStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerBarbershopAccessAttempt_pkey" PRIMARY KEY ("userId","barbershopId")
);

-- CreateIndex
CREATE INDEX "CustomerBarbershopAccessAttempt_lockedUntil_idx" ON "CustomerBarbershopAccessAttempt"("lockedUntil");

-- AddForeignKey
ALTER TABLE "CustomerBarbershopAccessAttempt" ADD CONSTRAINT "CustomerBarbershopAccessAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerBarbershopAccessAttempt" ADD CONSTRAINT "CustomerBarbershopAccessAttempt_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
