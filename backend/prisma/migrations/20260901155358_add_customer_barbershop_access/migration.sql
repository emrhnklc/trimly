-- CreateEnum
CREATE TYPE "BarbershopAccessMode" AS ENUM ('PUBLIC', 'CODE_REQUIRED');

-- AlterTable
ALTER TABLE "Barbershop" ADD COLUMN     "accessMode" "BarbershopAccessMode" NOT NULL DEFAULT 'PUBLIC';

-- CreateTable
CREATE TABLE "CustomerBarbershopAccess" (
    "userId" TEXT NOT NULL,
    "barbershopId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "CustomerBarbershopAccess_pkey" PRIMARY KEY ("userId","barbershopId")
);

-- CreateIndex
CREATE INDEX "CustomerBarbershopAccess_barbershopId_revokedAt_idx" ON "CustomerBarbershopAccess"("barbershopId", "revokedAt");

-- AddForeignKey
ALTER TABLE "CustomerBarbershopAccess" ADD CONSTRAINT "CustomerBarbershopAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerBarbershopAccess" ADD CONSTRAINT "CustomerBarbershopAccess_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
