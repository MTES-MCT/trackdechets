ALTER TABLE
  "default$default"."TransportSegment" RENAME TO "BsddTransporter";

ALTER TABLE
  "default$default"."BsddTransporter" RENAME COLUMN "mode" TO "transporterTransportMode";

ALTER INDEX IF EXISTS "default$default"."TransportSegment_pkey" RENAME TO "BsddTransporter_pkey";

ALTER INDEX IF EXISTS "default$default"."_TransportSegmentFormIdIdx" RENAME TO "_BsddTransporterFormIdIdx";

ALTER INDEX IF EXISTS "default$default"."_TransportSegmentTransporterCompanySiretIdx" RENAME TO "_BsddTransporterCompanySiretIdx";

ALTER INDEX IF EXISTS "default$default"."_TransportSegmentTransporterCompanyVatNumberIdx" RENAME TO "_BsddTransporterCompanyVatNumberIdx";