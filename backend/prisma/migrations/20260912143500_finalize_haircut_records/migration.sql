ALTER TABLE "HaircutRecord"
ADD COLUMN "finalizedAt" TIMESTAMP(3);

UPDATE "HaircutRecord"
SET "finalizedAt" = "updatedAt";
