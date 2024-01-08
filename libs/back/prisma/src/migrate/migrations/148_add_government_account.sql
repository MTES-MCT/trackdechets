/*
 Warnings:
 
 - A unique constraint covering the columns `[governmentAccountId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
 
 */
-- CreateEnum
CREATE TYPE "default$default"."GovernmentPermission" AS ENUM ('REGISTRY_CAN_READ_ALL');

-- AlterTable
ALTER TABLE
  "default$default"."User"
ADD
  COLUMN "governmentAccountId" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "default$default"."GovernmentAccount" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "permissions" "default$default"."GovernmentPermission" [],
  "authorizedIPs" TEXT [],
  "authorizedOrgIds" TEXT [],
  CONSTRAINT "GovernmentAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_governmentAccountId_key" ON "default$default"."User"("governmentAccountId");

-- AddForeignKey
ALTER TABLE
  "default$default"."User"
ADD
  CONSTRAINT "User_governmentAccountId_fkey" FOREIGN KEY ("governmentAccountId") REFERENCES "default$default"."GovernmentAccount"("id") ON DELETE
SET
  NULL ON UPDATE CASCADE;