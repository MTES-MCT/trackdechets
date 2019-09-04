# -*- coding=utf-8 -*-

from sqlalchemy import Column, String, Integer, Text
from airflow.hooks.data_preparation import PostgresDataset

from recipes.scraper import fetch_parallel, IcpeScraper, rubriques_dechets
from utils import get_rubrique_info


def scrap_rubriques():

    s3ic_filtered = PostgresDataset(
        "s3ic_filtered", schema="etl", postgres_conn_id="postgres_etl")

    rubriques_scraped = PostgresDataset(
        "rubriques_scraped", schema="etl", postgres_conn_id="postgres_etl")

    dtype = [
        Column("id", Integer, primary_key=True, autoincrement=True),
        Column("code_s3ic", String),
        Column("rubrique", String),
        Column("alinea", String),
        Column("date_autorisation", String),
        Column("etat_activite", String),
        Column("regime_autorise", String),
        Column("activite", Text),
        Column("volume", String),
        Column("unite", String)]

    rubriques_scraped.write_dtype(dtype)

    with rubriques_scraped.get_writer() as writer:

        for df in s3ic_filtered.get_dataframes(chunksize=100):

            urls = df['url_fiche'].tolist()
            code_s3ic_list = df['code_s3ic'].tolist()

            scrapers = [
                IcpeScraper(url)
                for url
                in urls]

            fetch_parallel(scrapers)

            for (code_s3ic, scraper) in zip(code_s3ic_list, scrapers):

                scraper.parse()
                scraper.find_rubriques()

                for rubrique in scraper.rubriques:

                    if rubrique["rubrique"] in rubriques_dechets:

                        row = {
                            "code_s3ic": code_s3ic,
                            **rubrique}

                        writer.write_row_dict(row)


def prepare_rubriques():

    # Input dataset
    rubriques_scraped_distinct = PostgresDataset(
        'rubriques_scraped_distinct',
        schema="etl",
        postgres_conn_id="postgres_etl")

    # Output dataset
    rubriques_prepared = PostgresDataset(
        'rubriques_prepared',
        schema="etl",
        postgres_conn_id="postgres_etl")

    dtype = rubriques_scraped_distinct.read_dtype(primary_key="id")

    out_dtype = [
        Column("id", Integer, primary_key=True, autoincrement=True),
        *dtype[1:],
        Column("category", String),
        Column("waste_type", String)]
    rubriques_prepared.write_dtype(out_dtype)

    with rubriques_prepared.get_writer() as writer:

        for row in rubriques_scraped_distinct.iter_rows():

            row["category"] = row["waste_type"] = None

            rubrique = row["rubrique"]
            alinea = row["alinea"]

            info = get_rubrique_info(rubrique, alinea)

            if info:
                row["category"] = info.category
                row["waste_type"] = info.waste_type

            writer.write_row_dict(row)