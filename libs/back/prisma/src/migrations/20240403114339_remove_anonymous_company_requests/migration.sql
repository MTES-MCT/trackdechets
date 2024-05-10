/*
  Warnings:

  - You are about to drop the `AnonymousCompanyRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AnonymousCompanyRequest" DROP CONSTRAINT "AnonymousCompanyRequest_userId_fkey";

-- DropTable
DROP TABLE "AnonymousCompanyRequest";
