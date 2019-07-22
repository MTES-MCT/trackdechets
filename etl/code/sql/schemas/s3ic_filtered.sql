DROP TABLE IF EXISTS etl.s3ic_filtered;

CREATE TABLE etl.s3ic_filtered
(
  gid SERIAL PRIMARY KEY,
  code_s3ic VARCHAR(10),
  x NUMERIC(10,0),
  y NUMERIC(10,0),
  epsg NUMERIC(10,0),
  nom_ets VARCHAR(254) ,
  num_dep VARCHAR(80),
  cd_insee VARCHAR(5),
  cd_postal VARCHAR(5),
  nomcommune VARCHAR(40),
  code_naf VARCHAR(6),
  lib_naf VARCHAR(254),
  num_siret VARCHAR(14),
  regime VARCHAR(4),
  lib_regime VARCHAR(50),
  ippc numeric(10,0),
  seveso VARCHAR(3),
  lib_seveso VARCHAR(20),
  famille_ic VARCHAR(80),
  url_fiche VARCHAR(127),
  rayon NUMERIC(10,0),
  precis_loc numeric(10,0),
  lib_precis VARCHAR(80),
  geom GEOMETRY(Point)
)