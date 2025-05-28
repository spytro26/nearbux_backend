/*
  Warnings:

  - You are about to drop the column `selectedLang` on the `ShopKeeper` table. All the data in the column will be lost.
  - You are about to drop the column `selectedLang` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ShopKeeper" DROP COLUMN "selectedLang";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "selectedLang";
