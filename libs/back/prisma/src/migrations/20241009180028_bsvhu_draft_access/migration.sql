-- AlterTable
ALTER TABLE "Bsvhu" ADD COLUMN     "canAccessDraftOrgIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "_BsvhuCanAccessDraftOrgIdsIdx" ON "Bsvhu" USING GIN ("canAccessDraftOrgIds");
