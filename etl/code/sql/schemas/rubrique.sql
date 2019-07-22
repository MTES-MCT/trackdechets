DROP TABLE IF EXISTS etl.rubrique;

CREATE TABLE etl.rubrique
(
  id SERIAL PRIMARY KEY,
  code_s3ic VARCHAR(255),
  rubrique VARCHAR(255),
  alinea VARCHAR(255),
  date_autorisation VARCHAR(255),
  etat_activite VARCHAR(255),
  regime_autorise VARCHAR(255),
  activite TEXT,
  volume VARCHAR(255),
  unite VARCHAR(255)
);