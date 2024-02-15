ALTER TABLE
  "default$default"."Bsda"
ADD
  COLUMN IF NOT EXISTS "transportersOrgIds" text [] DEFAULT '{}';

UPDATE
  "default$default"."Bsda" AS Bsda
SET
  "transportersOrgIds" = ARRAY (
    SELECT
      Transporter."transporterCompanySiret"
    FROM
      "default$default"."BsdaTransporter" AS Transporter
    WHERE
      Transporter."bsdaId" = Bsda."id"
      AND Transporter."transporterCompanySiret" IS NOT NULL
      AND Transporter."transporterCompanySiret" <> ''
    UNION
    SELECT
      Transporter."transporterCompanyVatNumber"
    FROM
      "default$default"."BsdaTransporter" AS Transporter
    WHERE
      Transporter."bsdaId" = Bsda."id"
      AND Transporter."transporterCompanyVatNumber" IS NOT NULL
      AND Transporter."transporterCompanyVatNumber" <> ''
  );

CREATE INDEX IF NOT EXISTS "_BsdaTransportersOrgIdsIdx" ON "default$default"."Bsda" USING GIN ("transportersOrgIds");