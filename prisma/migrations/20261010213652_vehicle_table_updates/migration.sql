/*
  Warnings:

  - Made the column `make` on table `Vehicle` required. This step will fail if there are existing NULL values in that column.
  - Made the column `model` on table `Vehicle` required. This step will fail if there are existing NULL values in that column.
  - Made the column `year` on table `Vehicle` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "trim" TEXT,
ALTER COLUMN "vin" DROP NOT NULL,
ALTER COLUMN "make" SET NOT NULL,
ALTER COLUMN "model" SET NOT NULL,
ALTER COLUMN "year" SET NOT NULL;
