DROP TABLE IF EXISTS etl.s3ic_join_irep;

CREATE TABLE etl.s3ic_join_irep (
    LIKE etl.s3ic_filtered,
    irep_identifiant VARCHAR(255),
    irep_nom_etablissement VARCHAR(255),
    irep_numero_siret VARCHAR(255),
    irep_adresse TEXT ,
    irep_code_postal VARCHAR(255),
    irep_commune VARCHAR(255),
    irep_departement VARCHAR(255),
    irep_region VARCHAR(255),
    irep_coordonnees_x NUMERIC(10,0),
    irep_coordonnees_y NUMERIC(10,0),
    irep_code_ape VARCHAR(255),
    irep_libelle_ape VARCHAR(255),
    irep_code_eprtr VARCHAR(255),
    irep_libelle_eprtr TEXT
);


INSERT INTO etl.s3ic_join_irep
SELECT *
FROM etl.s3ic_filtered AS a
LEFT JOIN etl.irep_distinct AS b
ON a.code_s3ic = CONCAT('0', b.identifiant);