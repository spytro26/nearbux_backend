/*
  Warnings:

  - The `rating` column on the `Shop` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `name` to the `Shop` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "name" TEXT NOT NULL,
DROP COLUMN "rating",
ADD COLUMN     "rating" INTEGER NOT NULL DEFAULT 0;
