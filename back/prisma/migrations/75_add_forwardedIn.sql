
-- AlterTable
ALTER TABLE "default$default"."Form" ADD COLUMN "forwardedInId" TEXT;
ALTER TABLE "default$default"."Form" ADD COLUMN "quantityReceivedType" "default$default"."QuantityType";
UPDATE "default$default"."Form" SET "quantityReceivedType" = 'REAL';

-- CreateIndex
CREATE UNIQUE INDEX "Form_forwardedInId_key" ON "default$default"."Form"("forwardedInId");

-- AddForeignKey
ALTER TABLE "default$default"."Form" ADD CONSTRAINT "Form_forwardedInId_fkey" FOREIGN KEY ("forwardedInId") REFERENCES "default$default"."Form"("id") ON DELETE SET NULL ON UPDATE CASCADE;

--- Fix inconsistant data
UPDATE "default$default"."Form" SET "recipientIsTempStorage" = FALSE
WHERE "recipientIsTempStorage" = TRUE and "temporaryStorageDetailId" is NULL;