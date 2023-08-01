-- Bsdasris
CREATE INDEX IF NOT EXISTS "_BsdasriTransporterCompanyVatNumberIdx" ON "default$default"."Bsdasri"("transporterCompanyVatNumber");
-- Bsda
CREATE INDEX IF NOT EXISTS "_BsdaTransporterCompanyVatNumberIdx" ON "default$default"."Bsda"("transporterCompanyVatNumber");

-- Bsff
CREATE INDEX IF NOT EXISTS "_BsffTransporterCompanyVatNumberIdx" ON default$default."Bsff"("transporterCompanyVatNumber");

-- Bsvhu
CREATE INDEX IF NOT EXISTS "_BsvhuTransporterCompanyVatNumberIdx" ON default$default."Bsvhu" ("transporterCompanyVatNumber");

-- Form
CREATE INDEX IF NOT EXISTS "_BsddTransporterTransporterCompanyVatNumberIdx" ON "default$default"."BsddTransporter"("transporterCompanyVatNumber");
