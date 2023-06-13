ALTER TABLE
  "default$default"."BsddTransporter" RENAME COLUMN "segmentNumber" TO "number";

-- AlterTable
ALTER TABLE
  "BsddTransporter"
ALTER COLUMN
  "number"
SET
  NOT NULL;

-- Increment transporter number to make room for first transporter
UPDATE
  "default$default"."BsddTransporter"
SET
  "number" = "number" + 1;

-- Migrate first transporter from Form table to BsddTransporter table
INSERT INTO
  "default$default"."BsddTransporter" (
    "id",
    "transporterCompanySiret",
    "transporterCompanyVatNumber",
    "transporterCompanyName",
    "transporterCompanyAddress",
    "transporterCompanyContact",
    "transporterCompanyPhone",
    "transporterCompanyMail",
    "transporterIsExemptedOfReceipt",
    "transporterReceipt",
    "transporterDepartment",
    "transporterValidityLimit",
    "transporterNumberPlate",
    "transporterTransportMode",
    "transporterCustomInfo",
    "takenOverAt",
    "takenOverBy",
    "createdAt",
    "updatedAt",
    "formId",
    "readyToTakeOver",
    "number"
  )
SELECT
  "id",
  "transporterCompanySiret",
  "transporterCompanyVatNumber",
  "transporterCompanyName",
  "transporterCompanyAddress",
  "transporterCompanyContact",
  "transporterCompanyPhone",
  "transporterCompanyMail",
  "transporterIsExemptedOfReceipt",
  "transporterReceipt",
  "transporterDepartment",
  "transporterValidityLimit",
  "transporterNumberPlate",
  "transporterTransportMode",
  "transporterCustomInfo",
  "takenOverAt",
  "takenOverBy",
  "createdAt",
  "updatedAt",
  "id",
  TRUE,
  1
FROM
  "default$default"."Form";

-- Drop transporter columns in Form table
DROP INDEX IF EXISTS "default$default"."_FormTransporterCompanySiretIdx";

ALTER TABLE
  "default$default"."Form" DROP COLUMN "transporterCompanySiret",
  DROP COLUMN "transporterCompanyVatNumber",
  DROP COLUMN "transporterCompanyName",
  DROP COLUMN "transporterCompanyAddress",
  DROP COLUMN "transporterCompanyContact",
  DROP COLUMN "transporterCompanyMail",
  DROP COLUMN "transporterIsExemptedOfReceipt",
  DROP COLUMN "transporterReceipt",
  DROP COLUMN "transporterDepartment",
  DROP COLUMN "transporterValidityLimit",
  DROP COLUMN "transporterNumberPlate",
  DROP COLUMN "transporterTransportMode",
  DROP COLUMN "transporterCustomInfo";