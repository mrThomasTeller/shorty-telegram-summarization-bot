/*
  Warnings:

  - The primary key for the `Tariff` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_tariffId_fkey";

-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "tariffId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Summary" ADD COLUMN     "userId" BIGINT;

-- AlterTable
ALTER TABLE "Tariff" DROP CONSTRAINT "Tariff_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Tariff_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Tariff_id_seq";

-- AddForeignKey
ALTER TABLE "Summary" ADD CONSTRAINT "Summary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_tariffId_fkey" FOREIGN KEY ("tariffId") REFERENCES "Tariff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
