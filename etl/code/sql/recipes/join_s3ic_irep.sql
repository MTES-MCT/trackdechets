INSERT INTO etl.s3ic_join_irep
    (SELECT *
    FROM etl.s3ic_filtered AS a
    LEFT JOIN etl.irep_distinct AS b
    ON a.code_s3ic = CONCAT('0', b.identifiant));