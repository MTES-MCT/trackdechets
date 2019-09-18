# -*- coding=utf-8 -*-

from airflow.hooks.data_preparation import PostgresDataset
from sqlalchemy import Column, Integer, String

from rubriques import get_rubrique_info


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
