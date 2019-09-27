DROP TABLE IF EXISTS etl.s3ic_join_sirene;

CREATE TABLE etl.s3ic_join_sirene (
  LIKE etl.s3ic_join_gerep,
  sirene_numero_siret VARCHAR(255),
  sirene_denominationunitelegale VARCHAR(255)
);

INSERT INTO etl.s3ic_join_sirene
SELECT
  A.*,
  B."siret__REF",
  B."denominationunitelegale__REF"
FROM etl.s3ic_join_gerep A
LEFT JOIN etl.s3ic_x_sirene B
ON
  A.code_s3ic = B.code_s3ic
  AND B."__IS_MATCH" = TRUE



