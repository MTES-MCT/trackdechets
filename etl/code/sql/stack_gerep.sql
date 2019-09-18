DROP TABLE IF EXISTS etl.gerep_stacked;

CREATE TABLE etl.gerep_stacked (
  LIKE etl.gerep_producteur,
  gerep_type varchar(255)
);

INSERT INTO etl.gerep_stacked
SELECT *, 'Producteur' from etl.gerep_producteur;

INSERT INTO etl.gerep_stacked
SELECT *, 'Traiteur' from etl.gerep_producteur;