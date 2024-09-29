/*
  Warnings:

  - You are about to drop the `ActivationKey` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ActivationKey" DROP CONSTRAINT "ActivationKey_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "ActivationKey" DROP CONSTRAINT "ActivationKey_tariffId_fkey";

-- DropForeignKey
ALTER TABLE "ActivationKey" DROP CONSTRAINT "ActivationKey_userId_fkey";

-- DropTable
DROP TABLE "ActivationKey";
