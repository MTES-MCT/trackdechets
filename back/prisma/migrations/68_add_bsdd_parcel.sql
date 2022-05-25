-- AlterTable
ALTER TABLE
  "default$default"."Form"
ADD
  COLUMN "wasteDetailsParcelNumbers" JSONB DEFAULT '[]'::JSONB;

-- AlterTable
ALTER TABLE
  "default$default"."Form"
ADD
  COLUMN "wasteDetailsAnalysisReferences" TEXT[];