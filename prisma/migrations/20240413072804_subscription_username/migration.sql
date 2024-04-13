/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_chatId_fkey";

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "username" TEXT,
ALTER COLUMN "chatId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_username_key" ON "Subscription"("username");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
