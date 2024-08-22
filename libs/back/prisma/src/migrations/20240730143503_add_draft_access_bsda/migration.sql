-- AlterTable
ALTER TABLE "Bsda" ADD COLUMN     "canAccessDraftOrgIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "_BsdaCanAccessDraftOrgIdsIdx" ON "Bsda" USING GIN ("canAccessDraftOrgIds");
