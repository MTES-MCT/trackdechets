DROP TABLE IF EXISTS etl.gerep_etablissement;

CREATE TABLE etl.gerep_etablissement (
  LIKE etl.gerep_stacked
);

ALTER TABLE etl.gerep_etablissement
DROP COLUMN annee,
DROP COLUMN code_dechet,
DROP COLUMN dechet,
DROP COLUMN gerep_type;

INSERT INTO etl.gerep_etablissement
SELECT
  code,
  MAX(nom),
  MAX(adresse),
  MAX(code_postal),
  MAX(commune),
  MAX(code_insee),
  MAX(code_ape),
  MAX(numero_siret),
  MAX(nom_contact),
  MAX(fonction_contact),
  MAX(tel_contact),
  MAX(mail_contact)
FROM etl.gerep_stacked
GROUP BY code;