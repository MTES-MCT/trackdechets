-- AlterTable
ALTER TABLE
  "default$default"."BsddRevisionRequest"
ADD
  COLUMN "wasteDetailsName" TEXT;

-- AlterTable
ALTER TABLE
  "default$default"."BsddRevisionRequest"
ADD
  COLUMN "wasteDetailsPackagingInfos" JSONB;

-- AlterTable
ALTER TABLE
  "default$default"."BsddRevisionRequest"
ADD
  COLUMN "processingOperationDescription" TEXT;