-- CreateTable
CREATE TABLE "User" (
  "id" BIGINT NOT NULL,
  "firstName" TEXT,
  "lastName" TEXT,
  "username" TEXT,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat" (
  "id" BIGINT NOT NULL,
  CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
  "id" BIGINT NOT NULL,
  "text" TEXT,
  "date" INTEGER NOT NULL,
  "userId" BIGINT,
  "chatId" BIGINT NOT NULL,
  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE
  "Message"
ADD
  CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON
DELETE
SET
  NULL ON
UPDATE
  CASCADE;

-- AddForeignKey
ALTER TABLE
  "Message"
ADD
  CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON
DELETE
  RESTRICT ON
UPDATE
  CASCADE;