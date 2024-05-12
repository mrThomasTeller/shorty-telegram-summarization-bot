-- DropForeignKey
ALTER TABLE "ActivationKey" DROP CONSTRAINT "ActivationKey_subscriptionId_fkey";

-- AddForeignKey
ALTER TABLE "ActivationKey" ADD CONSTRAINT "ActivationKey_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
