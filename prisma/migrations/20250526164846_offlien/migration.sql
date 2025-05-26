-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_soldToId_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "soldOffline" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "soldToId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_soldToId_fkey" FOREIGN KEY ("soldToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
