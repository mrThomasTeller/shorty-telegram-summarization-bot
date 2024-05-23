-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "subscriberUserId" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "subscriberUserName" TEXT;

-- AlterTable
ALTER TABLE "Tariff" ADD COLUMN     "name" TEXT NOT NULL DEFAULT '';
