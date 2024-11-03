-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "invitedByUserId" BIGINT;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
