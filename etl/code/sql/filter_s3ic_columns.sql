DROP TABLE IF EXISTS etl.s3ic_columns_filtered;
CREATE TABLE etl.s3ic_columns_filtered (
  id SERIAL PRIMARY KEY,
  code_s3ic VARCHAR(255),
  nom_ets VARCHAR(255),
  regime VARCHAR(255),
  lib_regime VARCHAR(255),
  seveso VARCHAR(255),
  lib_seveso VARCHAR(255),
  famille_ic VARCHAR(255),
  url_fiche VARCHAR(255),
  s3ic_numero_siret VARCHAR(255),
  irep_numero_siret VARCHAR(255),
  gerep_numero_siret VARCHAR(255),
  sirene_numero_siret VARCHAR(255)
);
INSERT INTO
  etl.s3ic_columns_filtered (
    code_s3ic,
    nom_ets,
    regime,
    lib_regime,
    seveso,
    lib_seveso,
    famille_ic,
    url_fiche,
    s3ic_numero_siret,
    irep_numero_siret,
    gerep_numero_siret,
    sirene_numero_siret
  )
SELECT
  code_s3ic,
  nom_ets,
  regime,
  lib_regime,
  seveso,
  lib_seveso,
  famille_ic,
  url_fiche,
  num_siret,
  irep_numero_siret,
  gerep_numero_siret,
  sirene_numero_siret
FROM
  etl.s3ic_join_sirene;