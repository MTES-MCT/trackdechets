INSERT INTO etl.s3ic_filtered
(SELECT * FROM
    (SELECT DISTINCT B.*
    FROM etl.rubrique as A
    LEFT JOIN etl.s3ic as B
    ON A.code_s3ic = B.code_s3ic
    WHERE
        A.rubrique LIKE '27__'
        OR A.rubrique LIKE '35__')
    AS temp)