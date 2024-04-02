-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "isMember" BOOLEAN;

-- CreateTable
CREATE TABLE "Statistic" (
    "date" TIMESTAMP(3) NOT NULL,
    "addedToChats" INTEGER NOT NULL DEFAULT 0,
    "removedFromChats" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Statistic_pkey" PRIMARY KEY ("date")
);
