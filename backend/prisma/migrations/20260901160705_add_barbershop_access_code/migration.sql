-- CreateTable
CREATE TABLE "BarbershopAccessCode" (
    "barbershopId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BarbershopAccessCode_pkey" PRIMARY KEY ("barbershopId")
);

-- AddForeignKey
ALTER TABLE "BarbershopAccessCode" ADD CONSTRAINT "BarbershopAccessCode_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
