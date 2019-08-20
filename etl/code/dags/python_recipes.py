# -*- coding=utf-8 -*-

from sqlalchemy import Column, String, Integer, Text
from airflow.hooks.data_preparation import PostgresDataset

from recipes.scraper import fetch_parallel, IcpeScraper, rubriques_dechets


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


COLLECTOR = "COLLECTOR"
WASTE_CENTER = "WASTE_CENTER"
WASTE_VEHICLES = "WASTE_VEHICLES"
WASTEPROCESSOR = "WASTEPROCESSOR"


RUBRIQUE_2_CATEGORY = {
    "2710": WASTE_CENTER,
    "2711": COLLECTOR,
    "2712": WASTE_VEHICLES,
    "2713": COLLECTOR,
    "2714": COLLECTOR,
    "2715": COLLECTOR,
    "2716": COLLECTOR,
    "2718": COLLECTOR,
    "2719": COLLECTOR,
    "2720": COLLECTOR,
    "2730": WASTEPROCESSOR,
    "2731": WASTE_CENTER,
    "2740": WASTEPROCESSOR,
    "2750": WASTEPROCESSOR,
    "2751": WASTEPROCESSOR,
    "2752": WASTEPROCESSOR,
    "2760": COLLECTOR,
    "2770": WASTEPROCESSOR,
    "2771": WASTEPROCESSOR,
    "2780": WASTEPROCESSOR,
    "2781": WASTEPROCESSOR,
    "2782": WASTEPROCESSOR,
    "2790": WASTEPROCESSOR,
    "2791": WASTEPROCESSOR,
    "2792": WASTEPROCESSOR,
    "2793": WASTEPROCESSOR,
    "2794": WASTEPROCESSOR,
    "2795": WASTEPROCESSOR,
    "2797": WASTEPROCESSOR,
    "2798": COLLECTOR,
    "3510": WASTEPROCESSOR,
    "3520": WASTEPROCESSOR,
    "3531": WASTEPROCESSOR,
    "3532": WASTEPROCESSOR,
    "3540": COLLECTOR,
    "3550": COLLECTOR,
    "3560": COLLECTOR
}


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
        Column("category", String)]
    rubriques_prepared.write_dtype(out_dtype)

    with rubriques_prepared.get_writer() as writer:

        for row in rubriques_scraped_distinct.iter_rows():

            row["category"] = RUBRIQUE_2_CATEGORY.get(row["rubrique"])

            writer.write_row_dict(row)