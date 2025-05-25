/*
  Warnings:

  - You are about to drop the column `soldById` on the `Order` table. All the data in the column will be lost.
  - The `status` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `quantity` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopId` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `price` on the `Product` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_soldById_fkey";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "soldById",
ADD COLUMN     "quantity" INTEGER NOT NULL,
ADD COLUMN     "shopId" INTEGER NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "price",
ADD COLUMN     "price" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
