/*
  Warnings:

  - The values [Boosty] on the enum `PaymentProvider` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentProvider_new" AS ENUM ('YooKassa');
ALTER TABLE "Subscription" ALTER COLUMN "paymentProvider" DROP DEFAULT;
ALTER TABLE "Subscription" ALTER COLUMN "paymentProvider" TYPE "PaymentProvider_new" USING ("paymentProvider"::text::"PaymentProvider_new");
ALTER TYPE "PaymentProvider" RENAME TO "PaymentProvider_old";
ALTER TYPE "PaymentProvider_new" RENAME TO "PaymentProvider";
DROP TYPE "PaymentProvider_old";
ALTER TABLE "Subscription" ALTER COLUMN "paymentProvider" SET DEFAULT 'YooKassa';
COMMIT;

-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "paymentProvider" SET DEFAULT 'YooKassa';
