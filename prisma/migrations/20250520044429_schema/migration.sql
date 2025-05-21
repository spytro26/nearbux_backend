/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `ShopKeeper` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `ShopKeeper` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "Adver" (
    "id" SERIAL NOT NULL,
    "image" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "shopId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shopKeeperId" INTEGER,

    CONSTRAINT "Adver_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopKeeper_phone_key" ON "ShopKeeper"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "ShopKeeper_username_key" ON "ShopKeeper"("username");

-- AddForeignKey
ALTER TABLE "Adver" ADD CONSTRAINT "Adver_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adver" ADD CONSTRAINT "Adver_shopKeeperId_fkey" FOREIGN KEY ("shopKeeperId") REFERENCES "ShopKeeper"("id") ON DELETE SET NULL ON UPDATE CASCADE;
