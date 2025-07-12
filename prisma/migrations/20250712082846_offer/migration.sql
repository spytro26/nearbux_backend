-- CreateEnum
CREATE TYPE "OfferType" AS ENUM ('product', 'money', 'percentage');

-- CreateTable
CREATE TABLE "Offer" (
    "id" SERIAL NOT NULL,
    "type" "OfferType" NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "minimum_amount" INTEGER,
    "product" INTEGER,
    "percentage" INTEGER,
    "fixed" INTEGER,
    "shop" INTEGER NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_shop_fkey" FOREIGN KEY ("shop") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_product_fkey" FOREIGN KEY ("product") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
