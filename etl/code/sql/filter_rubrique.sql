DROP TABLE IF EXISTS etl.rubrique_filtered;

CREATE TABLE etl.rubrique_filtered (
  LIKE etl.rubrique_distinct
);

INSERT INTO etl.rubrique_filtered
SELECT * FROM etl.rubrique_distinct
WHERE
  rubrique LIKE '27__' OR
  rubrique LIKE '35__';


ALTER TABLE etl.rubrique_filtered
ADD COLUMN id SERIAL,
ADD CONSTRAINT rubrique_filtered_pkey PRIMARY KEY ("id");