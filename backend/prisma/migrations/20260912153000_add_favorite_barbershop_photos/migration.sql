CREATE TABLE "FavoriteBarbershopPhoto" (
    "userId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteBarbershopPhoto_pkey" PRIMARY KEY ("userId", "photoId")
);

CREATE INDEX "FavoriteBarbershopPhoto_photoId_idx" ON "FavoriteBarbershopPhoto"("photoId");

ALTER TABLE "FavoriteBarbershopPhoto"
ADD CONSTRAINT "FavoriteBarbershopPhoto_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FavoriteBarbershopPhoto"
ADD CONSTRAINT "FavoriteBarbershopPhoto_photoId_fkey"
FOREIGN KEY ("photoId") REFERENCES "BarbershopPhoto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
