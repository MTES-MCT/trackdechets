DROP TABLE IF EXISTS etl.irep_distinct;

CREATE TABLE etl.irep_distinct (
  LIKE etl.irep_source
);

INSERT INTO etl.irep_distinct
SELECT DISTINCT * from etl.irep_source;