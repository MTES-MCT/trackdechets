DROP TABLE IF EXISTS etl.s3ic_join_gerep;

CREATE TABLE etl.s3ic_join_gerep (
  LIKE etl.s3ic_join_irep,
  gerep_nom VARCHAR(255),
  gerep_adresse VARCHAR(255),
  gerep_code_postal VARCHAR(255),
  gerep_commune VARCHAR(255),
  gerep_code_insee VARCHAR(255),
  gerep_code_ape VARCHAR(255),
  gerep_numero_siret VARCHAR(255),
  gerep_nom_contact VARCHAR(255),
  gerep_fonction_contact VARCHAR(255),
  gerep_tel_contact VARCHAR(255),
  gerep_mail_contact VARCHAR(255)
);

INSERT INTO etl.s3ic_join_gerep
SELECT
  A.*,
  B.nom,
  B.adresse,
  B.code_postal,
  B.commune,
  B.code_insee,
  B.code_ape,
  B.numero_siret,
  B.nom_contact,
  B.fonction_contact,
  B.tel_contact,
  B.mail_contact
FROM etl.s3ic_join_irep A
LEFT JOIN etl.gerep_etablissement B
ON A.code_s3ic = CONCAT('0', B.code);