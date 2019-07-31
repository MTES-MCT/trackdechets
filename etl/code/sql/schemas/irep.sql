DROP TABLE IF EXISTS etl.irep;

CREATE TABLE etl.irep (
  identifiant varchar(255),
  nom_etablissement varchar(255),
  numero_siret varchar(255),
  adresse text,
  code_postal varchar(255),
  commune varchar(255),
  departement varchar(255),
  region varchar(255),
  coordonnees_x float8,
  coordonnees_y float8,
  code_ape varchar(255),
  libelle_ape varchar(255),
  code_eprtr varchar(255),
  libelle_eprtr text
);