-- Constraint & index had the same name
ALTER TABLE "default$default"."BsddTransporter" RENAME CONSTRAINT "_BsddTransporterFormIdIdx" TO "BsddTransporter_formId_fkey";