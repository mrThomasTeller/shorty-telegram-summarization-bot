-- DropIndex
DROP INDEX "Subscription_chatId_key";

-- DropIndex
DROP INDEX "Subscription_userId_key";

-- AlterTable
ALTER TABLE "ActivationKey" ADD COLUMN     "userId" BIGINT;

-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "email" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ActivationKey" ADD CONSTRAINT "ActivationKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
