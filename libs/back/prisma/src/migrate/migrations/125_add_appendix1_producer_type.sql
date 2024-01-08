-- Alter enum
ALTER TYPE "default$default"."EmitterType" ADD VALUE 'APPENDIX1_PRODUCER';

-- CreateTable
CREATE TABLE "default$default"."SignatureAutomation" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignatureAutomation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SignatureAutomation_fkey_unique_together" UNIQUE ("fromId", "toId")
);

-- AddForeignKey
ALTER TABLE "default$default"."SignatureAutomation" ADD CONSTRAINT "SignatureAutomation_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "default$default"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "default$default"."SignatureAutomation" ADD CONSTRAINT "SignatureAutomation_toId_fkey" FOREIGN KEY ("toId") REFERENCES "default$default"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "_SignatureAutomationFromIdIdx" ON "default$default"."SignatureAutomation"("fromId");
