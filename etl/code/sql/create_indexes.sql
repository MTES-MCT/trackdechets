CREATE INDEX
IF NOT EXISTS
installation_s3icnumerosiret
ON "default$default"."Installation" ("s3icNumeroSiret");

CREATE INDEX
IF NOT EXISTS
installation_irepnumerosiret
ON "default$default"."Installation" ("irepNumeroSiret");

CREATE INDEX
IF NOT EXISTS
installation_gerepnumerosiret
ON "default$default"."Installation" ("gerepNumeroSiret");

CREATE INDEX
IF NOT EXISTS
installation_sirenenumerosiret
ON "default$default"."Installation" ("sireneNumeroSiret");

CREATE INDEX
IF NOT EXISTS
rubrique_codes3ic
ON "default$default"."Rubrique" ("codeS3ic");

CREATE INDEX
IF NOT EXISTS
declaration_codeS3ic
ON "default$default"."Declaration" ("codeS3ic");