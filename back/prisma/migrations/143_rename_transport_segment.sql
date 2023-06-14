ALTER TABLE
  "default$default"."TransportSegment" RENAME TO "BsddTransporter";

ALTER TABLE
  "default$default"."BsddTransporter" RENAME COLUMN "mode" TO "transporterTransportMode";

ALTER TABLE
  "default$default"."BsddTransporter"
ADD
  COLUMN "transporterCustomInfo" TEXT;

ALTER INDEX IF EXISTS "default$default"."TransportSegment_pkey" RENAME TO "BsddTransporter_pkey";

ALTER INDEX IF EXISTS "default$default"."_TransportSegmentFormIdIdx" RENAME TO "_BsddTransporterFormIdIdx";

ALTER INDEX IF EXISTS "default$default"."_TransportSegmentTransporterCompanySiretIdx" RENAME TO "_BsddTransporterCompanySiretIdx";

ALTER INDEX IF EXISTS "default$default"."_TransportSegmentTransporterCompanyVatNumberIdx" RENAME TO "_BsddTransporterCompanyVatNumberIdx";

-- DropForeignKey
ALTER TABLE
  "default$default"."BsddTransporter" DROP CONSTRAINT "TransportSegment_form_fkey";

-- AddForeignKey
-- Make sure transporters are deleted when a form is deleted
ALTER TABLE
  "default$default"."BsddTransporter"
ADD
  CONSTRAINT "_BsddTransporterFormIdIdx" FOREIGN KEY ("formId") REFERENCES "default$default"."Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;