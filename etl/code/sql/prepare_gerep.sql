DROP TABLE IF EXISTS etl.gerep_prepared;

CREATE TABLE etl.gerep_prepared (
  LIKE etl.gerep_columns_filtered
);

INSERT INTO etl.gerep_prepared
SELECT
  id,
  CONCAT('0', code_s3ic),
  nom_ets,
  annee,
  code_dechet,
  lib_dechet,
  gerep_type
FROM etl.gerep_columns_filtered


