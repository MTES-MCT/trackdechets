DROP TABLE IF EXISTS etl.s3ic_filtered;

CREATE TABLE etl.s3ic_filtered (LIKE etl.s3ic_source);

INSERT INTO etl.s3ic_filtered
SELECT * FROM etl.s3ic_source
WHERE code_s3ic IN (
    SELECT DISTINCT code_s3ic
    FROM etl.rubrique_filtered
)