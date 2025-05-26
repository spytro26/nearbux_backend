/*
  Warnings:

  - You are about to drop the column `value` on the `Shop` table. All the data in the column will be lost.
  - Added the required column `coinValue` to the `Shop` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "canBePurchasedByCoin" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Shop" DROP COLUMN "value",
ADD COLUMN     "closes" TIMESTAMP(3),
ADD COLUMN     "coinValue" INTEGER NOT NULL,
ADD COLUMN     "opens" TIMESTAMP(3);
