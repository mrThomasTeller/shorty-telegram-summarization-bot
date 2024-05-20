/*
  Warnings:

  - You are about to drop the column `name` on the `Tariff` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Tariff` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ActivationKey" DROP CONSTRAINT "ActivationKey_tariffId_fkey";

-- AlterTable
ALTER TABLE "Tariff" DROP COLUMN "name",
DROP COLUMN "price";

-- AddForeignKey
ALTER TABLE "ActivationKey" ADD CONSTRAINT "ActivationKey_tariffId_fkey" FOREIGN KEY ("tariffId") REFERENCES "Tariff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
