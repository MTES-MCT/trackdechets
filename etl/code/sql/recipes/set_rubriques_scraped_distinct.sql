INSERT INTO etl.rubriques_scraped_distinct (
  code_s3ic,
  rubrique,
  alinea,
  date_autorisation,
  etat_activite,
  regime_autorise,
  activite,
  volume,
  unite)
(SELECT DISTINCT
  code_s3ic,
  rubrique,
  alinea,
  date_autorisation,
  etat_activite,
  regime_autorise,
  activite,
  volume,
  unite
  FROM etl.rubriques_scraped)