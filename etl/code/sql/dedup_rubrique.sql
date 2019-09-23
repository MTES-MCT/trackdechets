DROP TABLE IF EXISTS etl.rubrique_distinct;

CREATE TABLE etl.rubrique_distinct (
  LIKE etl.rubrique_source
);

INSERT INTO etl.rubrique_distinct
SELECT DISTINCT * FROM etl.rubrique_source;
