CREATE TYPE "HaircutPhotoUploader" AS ENUM ('BUSINESS', 'CUSTOMER');

ALTER TABLE "HaircutPhoto"
ADD COLUMN "uploadedBy" "HaircutPhotoUploader" NOT NULL DEFAULT 'BUSINESS';
