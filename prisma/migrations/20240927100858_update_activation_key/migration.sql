-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('YooKassa', 'Boosty');

-- AlterTable
ALTER TABLE "ActivationKey" ADD COLUMN     "used" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "autoRenew" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "expires" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "payedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "paymentProvider" "PaymentProvider" NOT NULL DEFAULT 'Boosty',
ADD COLUMN     "renewPeriodMonths" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "notifiedAt" DROP NOT NULL,
ALTER COLUMN "subscriberUserId" DROP DEFAULT;
