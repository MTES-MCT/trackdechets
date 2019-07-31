DROP TABLE IF EXISTS etl.rubriques

CREATE TABLE etl.rubriques (
  "numero_inspection" text,
  "nom_etablissement" text,
  "code_postal" text,
  "commune" text,
  "departement" text,
  "regime" text,
  "seveso" text,
  "etat_activite" text,
  "priorite_nationale" text,
  "ied_mtd" text,
  "rubrique" int8,
  "alinea" text,
  "regime_ic" text,
  "etat_activite_ic" text,
  "volume" text,
  "unite" text
);