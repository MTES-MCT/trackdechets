-- Add partial indexes for Bsdasri table

-- Index for non-empty intermediaries
CREATE INDEX IF NOT EXISTS  "Bsdasri_intermediaries_nonempty"
ON "Bsdasri"
USING gin ("intermediariesOrgIds")
WHERE (
    "intermediariesOrgIds" IS NOT NULL
    AND "intermediariesOrgIds" <> '{}'::text[]
    AND "isDeleted" = false
    AND "isDraft" = false
);

-- Index for emitter with row number
CREATE INDEX IF NOT EXISTS  "Bsdasri_emitter_active_rownum"
ON "Bsdasri"
USING btree ("emitterCompanySiret", "rowNumber")
WHERE (
    "isDeleted" = false
    AND "isDraft" = false
);

-- Index for transporter with row number
CREATE INDEX IF NOT EXISTS  "Bsdasri_transporter_active_rownum"
ON "Bsdasri"
USING btree ("transporterCompanySiret", "rowNumber")
WHERE (
    "isDeleted" = false
    AND "isDraft" = false
);

-- Index for transporter VAT with row number
CREATE INDEX IF NOT EXISTS  "Bsdasri_transporter_vat_active_rownum"
ON "Bsdasri"
USING btree ("transporterCompanyVatNumber", "rowNumber")
WHERE (
    "isDeleted" = false
    AND "isDraft" = false
);

-- Index for destination with row number
CREATE INDEX IF NOT EXISTS  "Bsdasri_destination_active_rownum"
ON "Bsdasri"
USING btree ("destinationCompanySiret", "rowNumber")
WHERE (
    "isDeleted" = false
    AND "isDraft" = false
);

-- Index for eco organism with row number
CREATE INDEX IF NOT EXISTS  "Bsdasri_eco_active_rownum"
ON "Bsdasri"
USING btree ("ecoOrganismeSiret", "rowNumber")
WHERE (
    "isDeleted" = false
    AND "isDraft" = false
);

-- Index for trader with row number
CREATE INDEX IF NOT EXISTS  "Bsdasri_trader_active_rownum"
ON "Bsdasri"
USING btree ("traderCompanySiret", "rowNumber")
WHERE (
    "isDeleted" = false
    AND "isDraft" = false
);


-- Index for broker with row number
CREATE INDEX IF NOT EXISTS  "Bsdasri_broker_active_rownum"
ON "Bsdasri"
USING btree ("brokerCompanySiret", "rowNumber")
WHERE (
    "isDeleted" = false
    AND "isDraft" = false
);

