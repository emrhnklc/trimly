/*
  Warnings:

  - Added the required column `mimeType` to the `HaircutPhoto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sizeBytes` to the `HaircutPhoto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "HaircutPhoto" ADD COLUMN     "mimeType" TEXT NOT NULL,
ADD COLUMN     "sizeBytes" INTEGER NOT NULL;
