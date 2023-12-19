-- CreateIndex
CREATE INDEX IF NOT EXISTS "_FormSentAtIdx" ON "default$default"."Form"("sentAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_FormCreatedAtIdx" ON "default$default"."Form"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_FormWasteDetailsCodeIdx" ON "default$default"."Form"("wasteDetailsCode");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_FormCustomIdIdx" ON "default$default"."Form"("customId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_FormRecipientIsTempStorageIdx" ON "default$default"."Form"("recipientIsTempStorage")
WHERE
    "Form"."recipientIsTempStorage" = true;