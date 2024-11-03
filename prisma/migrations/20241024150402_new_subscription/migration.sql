-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "disableSubscriptionCheck" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "triesToRenew" INTEGER NOT NULL DEFAULT 0;
