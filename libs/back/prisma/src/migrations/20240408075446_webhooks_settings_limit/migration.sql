/*
  Warnings:

  - A unique constraint covering the columns `[orgId,endpointUri]` on the table `WebhookSetting` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "WebhookSetting_orgId_key";

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "webhookSettingsLimit" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "WebhookSetting_orgId_endpointUri_key" ON "WebhookSetting"("orgId", "endpointUri");
