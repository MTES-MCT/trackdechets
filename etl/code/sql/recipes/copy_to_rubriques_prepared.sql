INSERT INTO etl.rubriques_prepared (
  SELECT * FROM etl.rubriques_scraped_distinct
)