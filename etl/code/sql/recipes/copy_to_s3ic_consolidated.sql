INSERT INTO etl.s3ic_consolidated (
  SELECT * FROM etl.s3ic_join_irep
)