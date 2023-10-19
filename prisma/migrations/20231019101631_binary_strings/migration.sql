/*
  Warnings:

  - The `text` column on the `Message` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `firstName` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `lastName` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `username` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Message" DROP COLUMN "text",
ADD COLUMN     "text" BYTEA;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "firstName",
ADD COLUMN     "firstName" BYTEA,
DROP COLUMN "lastName",
ADD COLUMN     "lastName" BYTEA,
DROP COLUMN "username",
ADD COLUMN     "username" BYTEA;
