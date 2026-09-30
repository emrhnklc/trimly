ALTER TABLE "Barbershop"
ADD COLUMN "acceptsBookings" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Barbershop"
SET "acceptsBookings" = true
WHERE "isDiscoverable" = true;
