ALTER TABLE "Barbershop"
ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION;

ALTER TABLE "Barbershop"
ADD CONSTRAINT "Barbershop_coordinates_pair_check"
CHECK (("latitude" IS NULL AND "longitude" IS NULL) OR ("latitude" IS NOT NULL AND "longitude" IS NOT NULL));

ALTER TABLE "Barbershop"
ADD CONSTRAINT "Barbershop_latitude_check"
CHECK ("latitude" IS NULL OR "latitude" BETWEEN -90 AND 90),
ADD CONSTRAINT "Barbershop_longitude_check"
CHECK ("longitude" IS NULL OR "longitude" BETWEEN -180 AND 180);
