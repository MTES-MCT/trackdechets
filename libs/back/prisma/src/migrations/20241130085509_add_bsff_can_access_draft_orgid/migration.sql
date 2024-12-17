-- AlterTable
ALTER TABLE "Bsff" ADD COLUMN     "canAccessDraftOrgIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "_BsffCanAccessDraftOrgIdsIdx" ON "Bsff" USING GIN ("canAccessDraftOrgIds");
