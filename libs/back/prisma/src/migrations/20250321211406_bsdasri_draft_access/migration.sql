-- AlterTable
ALTER TABLE "Bsdasri" ADD COLUMN     "canAccessDraftOrgIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "_BsdasriCanAccessDraftOrgIdsIdx" ON "Bsdasri" USING GIN ("canAccessDraftOrgIds");
