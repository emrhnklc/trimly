/*
  Warnings:

  - Added the required column `customerConsentConfirmedAt` to the `HaircutPhoto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "HaircutPhoto" ADD COLUMN     "customerConsentConfirmedAt" TIMESTAMP(3) NOT NULL;
