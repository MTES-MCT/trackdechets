DROP TABLE IF EXISTS etl.gerep_columns_filtered;

CREATE TABLE etl.gerep_columns_filtered (
  id SERIAL PRIMARY KEY,
  code_s3ic VARCHAR(255),
  nom_ets VARCHAR(255),
  annee VARCHAR(255),
  code_dechet VARCHAR(255),
  lib_dechet VARCHAR(255),
  gerep_type VARCHAR(255)
);

INSERT INTO etl.gerep_columns_filtered (
  code_s3ic,
  nom_ets,
  annee,
  code_dechet,
  lib_dechet,
  gerep_type
)
SELECT
  code,
  nom,
  annee,
  code_dechet,
  dechet,
  gerep_type
FROM
  etl.gerep_stacked;