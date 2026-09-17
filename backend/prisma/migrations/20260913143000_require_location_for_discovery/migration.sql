UPDATE "Barbershop"
SET "isDiscoverable" = FALSE
WHERE "latitude" IS NULL OR "longitude" IS NULL;

ALTER TABLE "Barbershop"
ALTER COLUMN "isDiscoverable" SET DEFAULT FALSE;
