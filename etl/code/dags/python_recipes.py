# -*- coding=utf-8 -*-

import cuid
from airflow.hooks.data_preparation import PostgresDataset
from sqlalchemy import Column, Integer, String

from rubriques import get_rubrique_info
from config import POSTGRES_ETL_CONN_ID, POSTGRES_PRISMA_CONN_ID


def prepare_rubrique():

    # Input dataset
    rubrique_filtered = PostgresDataset(
        'rubrique_filtered',
        schema="etl",
        postgres_conn_id="postgres_etl")

    # Output dataset
    rubrique_prepared = PostgresDataset(
        'rubrique_prepared',
        schema="etl",
        postgres_conn_id="postgres_etl")

    dtype = rubrique_filtered.read_dtype()

    out_dtype = [
        Column("id", Integer, primary_key=True, autoincrement=True),
        * dtype,
        Column("category", String),
        Column("waste_type", String)]

    rubrique_prepared.write_dtype(out_dtype)

    with rubrique_prepared.get_writer() as writer:

        for row in rubrique_filtered.iter_rows():

            row["category"] = row["waste_type"] = None

            rubrique = row["rubrique"]
            alinea = row["alinea"]

            info = get_rubrique_info(rubrique, alinea)

            if info:
                row["category"] = info.category
                row["waste_type"] = info.waste_type

            writer.write_row_dict(row)


def deploy_s3ic():
    """ Copy s3ic data from etl database to prisma database """

    s3ic_etl = PostgresDataset(
        postgres_conn_id=POSTGRES_ETL_CONN_ID,
        schema="etl",
        name="s3ic")

    s3ic_prisma = PostgresDataset(
        postgres_conn_id=POSTGRES_PRISMA_CONN_ID,
        schema="default$default",
        name="Installation")

    s3ic_prisma.run("DELETE FROM \"default$default\".\"Installation\"")

    generator = cuid.CuidGenerator()

    with s3ic_prisma.get_writer() as writer:
        for row in s3ic_etl.iter_rows():
            row["id"] = generator.cuid()
            # map snake_case to camelCase
            row["codeS3ic"] = row["code_s3ic"]
            row["nomEts"] = row["nom_ets"]
            row["libRegime"] = row["lib_regime"]
            row["libSeveso"] = row["lib_seveso"]
            row["familleIc"] = row["famille_ic"]
            row["urlFiche"] = row["url_fiche"]
            row["s3icNumeroSiret"] = row["s3ic_numero_siret"]
            row["irepNumeroSiret"] = row["irep_numero_siret"]
            row["gerepNumeroSiret"] = row["gerep_numero_siret"]
            row["sireneNumeroSiret"] = row["sirene_numero_siret"]
            writer.write_row_dict(row)


def deploy_rubrique():
    """ Copy rubrique data from etl database to prisma database """

    rubrique_etl = PostgresDataset(
        postgres_conn_id=POSTGRES_ETL_CONN_ID,
        schema="etl",
        name="rubrique")

    rubrique_prisma = PostgresDataset(
        postgres_conn_id=POSTGRES_PRISMA_CONN_ID,
        schema="default$default",
        name="Rubrique")

    rubrique_prisma.run("DELETE FROM \"default$default\".\"Rubrique\"")

    generator = cuid.CuidGenerator()

    with rubrique_prisma.get_writer() as writer:
        for row in rubrique_etl.iter_rows():
            row["id"] = generator.cuid()
            # map snake_case to camelCase
            row["codeS3ic"] = row["code_s3ic"]
            row["dateAutorisation"] = row["date_autorisation"]
            row["etatActivite"] = row["etat_activite"]
            row["regimeAutorise"] = row["regime_autorise"]
            row["wasteType"] = row["waste_type"]
            writer.write_row_dict(row)


def deploy_gerep():
    """ Copy gerep data from etl database to prisma database """

    gerep_etl = PostgresDataset(
        postgres_conn_id=POSTGRES_ETL_CONN_ID,
        schema="etl",
        name="gerep")

    gerep_prisma = PostgresDataset(
        postgres_conn_id=POSTGRES_PRISMA_CONN_ID,
        schema="default$default",
        name="Declaration")

    gerep_prisma.run("DELETE FROM \"default$default\".\"Declaration\"")

    generator = cuid.CuidGenerator()

    with gerep_prisma.get_writer() as writer:
        for row in gerep_etl.iter_rows(primary_key="id"):
            row["id"] = generator.cuid()
            # map snake_case to camelCase
            row["codeS3ic"] = row["code_s3ic"]
            row["nomEts"] = row["nom_ets"]
            row["codeDechet"] = row["code_dechet"]
            row["libDechet"] = row["lib_dechet"]
            row["gerepType"] = row["gerep_type"]
            writer.write_row_dict(row)
