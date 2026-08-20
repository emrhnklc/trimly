-- CreateTable
CREATE TABLE "FavoriteBarbershop" (
    "userId" TEXT NOT NULL,
    "barbershopId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteBarbershop_pkey" PRIMARY KEY ("userId","barbershopId")
);

-- CreateIndex
CREATE INDEX "FavoriteBarbershop_barbershopId_idx" ON "FavoriteBarbershop"("barbershopId");

-- AddForeignKey
ALTER TABLE "FavoriteBarbershop" ADD CONSTRAINT "FavoriteBarbershop_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteBarbershop" ADD CONSTRAINT "FavoriteBarbershop_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
