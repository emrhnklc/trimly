CREATE TYPE "PortfolioPublicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVOKED');

CREATE TABLE "BarberPortfolioItem" (
    "id" TEXT NOT NULL,
    "haircutPhotoId" TEXT NOT NULL,
    "barbershopId" TEXT NOT NULL,
    "businessMemberId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "title" TEXT,
    "status" "PortfolioPublicationStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BarberPortfolioItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BarberPortfolioItem_haircutPhotoId_key" ON "BarberPortfolioItem"("haircutPhotoId");
CREATE INDEX "BarberPortfolioItem_barbershopId_status_createdAt_idx" ON "BarberPortfolioItem"("barbershopId", "status", "createdAt");
CREATE INDEX "BarberPortfolioItem_businessMemberId_status_idx" ON "BarberPortfolioItem"("businessMemberId", "status");
CREATE INDEX "BarberPortfolioItem_customerId_status_idx" ON "BarberPortfolioItem"("customerId", "status");

ALTER TABLE "BarberPortfolioItem" ADD CONSTRAINT "BarberPortfolioItem_haircutPhotoId_fkey" FOREIGN KEY ("haircutPhotoId") REFERENCES "HaircutPhoto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BarberPortfolioItem" ADD CONSTRAINT "BarberPortfolioItem_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BarberPortfolioItem" ADD CONSTRAINT "BarberPortfolioItem_businessMemberId_fkey" FOREIGN KEY ("businessMemberId") REFERENCES "BusinessMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BarberPortfolioItem" ADD CONSTRAINT "BarberPortfolioItem_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "FavoritePortfolioItem" (
    "userId" TEXT NOT NULL,
    "portfolioItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoritePortfolioItem_pkey" PRIMARY KEY ("userId", "portfolioItemId")
);

CREATE INDEX "FavoritePortfolioItem_portfolioItemId_idx" ON "FavoritePortfolioItem"("portfolioItemId");
ALTER TABLE "FavoritePortfolioItem" ADD CONSTRAINT "FavoritePortfolioItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FavoritePortfolioItem" ADD CONSTRAINT "FavoritePortfolioItem_portfolioItemId_fkey" FOREIGN KEY ("portfolioItemId") REFERENCES "BarberPortfolioItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
