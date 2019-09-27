# -*- coding=utf-8 -*-

"""
This DAG is used to consolidate data from different
databases: s3ic, irep, gerep, sirene
The main goal is to identify every ICPE (Installation
classée pour la protection de l'environnement) with
its SIRET
"""

import os
from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.data_preparation import (CopyTableOperator,
                                                DownloadUnzipOperator,
                                                EmbulkOperator,
                                                Shp2pgsqlOperator)
from airflow.operators.dummy_operator import DummyOperator
from airflow.operators.postgres_operator import PostgresOperator
from airflow.operators.python_operator import PythonOperator

import python_recipes as recipes
from config import POSTGRES_ETL_CONN_ID, DATA_DIR, DOWNLOAD_URL, SQL_DIR
from utils import connection_env


def get_default_args(conf):
    default = {
        "owner": "airflow",
        "depends_on_past": False,
        "email": ["benoit.guigal@protonmail.com"],
        "email_on_failure": False,
        "email_on_retry": False,
        "retries": 0,
        "retry_delay": timedelta(minutes=1)
    }
    return {**(default), **conf}


default_args = get_default_args({
    "start_date": datetime(2019, 6, 11, 5)
})


with DAG("consolidate",
         default_args=default_args,
         schedule_interval="@once",
         template_searchpath=SQL_DIR,
         dagrun_timeout=timedelta(hours=24)) as dag:

    start = DummyOperator(task_id="start")

    # Download s3ic data from georisques
    download_s3ic = DownloadUnzipOperator(
        task_id="download_s3ic",
        url="%s/s3ic.zip" % DOWNLOAD_URL,
        dir_path=DATA_DIR)

    # Download rubriques ICPE for 27xx and 35xx
    # from installationsclassées
    download_rubrique = DownloadUnzipOperator(
        task_id="download_rubrique",
        url="%s/rubriques.zip" % DOWNLOAD_URL,
        dir_path="%s/s3ic" % DATA_DIR)

    # Download IREP data
    download_irep = DownloadUnzipOperator(
        task_id="download_irep",
        url="%s/irep.zip" % DOWNLOAD_URL,
        dir_path=DATA_DIR)

    # Download GEREP
    download_gerep = DownloadUnzipOperator(
        task_id="download_gerep",
        url="%s/gerep.zip" % DOWNLOAD_URL,
        dir_path=DATA_DIR)

    # Download s3ic_x_sirene (from themergemachine.com)
    download_sirene = DownloadUnzipOperator(
        task_id="download_sirene",
        url="%s/sirene.zip" % DOWNLOAD_URL,
        dir_path=DATA_DIR)

    # Load s3ic data
    s3ic_shapefile = os.path.join(DATA_DIR, 's3ic', 'ICPE_4326.shp')
    load_s3ic = Shp2pgsqlOperator(
        task_id='load_s3ic',
        shapefile=s3ic_shapefile,
        table='etl.s3ic_source',
        connection=POSTGRES_ETL_CONN_ID)

    # Load rubriques
    load_rubrique = EmbulkOperator(
        'rubrique.yml.liquid',
        task_id='load_rubrique',
        env=connection_env(POSTGRES_ETL_CONN_ID))

    # Load IREP data
    load_irep = EmbulkOperator(
        'irep.yml.liquid',
        task_id='load_irep',
        env=connection_env(POSTGRES_ETL_CONN_ID))

    # Load GEREP data
    load_gerep_traiteur = EmbulkOperator(
        'gerep_traiteur.yml.liquid',
        task_id='load_gerep_traiteur',
        env=connection_env(POSTGRES_ETL_CONN_ID))

    load_gerep_producteur = EmbulkOperator(
        'gerep_producteur.yml.liquid',
        task_id='load_gerep_producteur',
        env=connection_env(POSTGRES_ETL_CONN_ID))

    # Load s3ic_x_sirene (from themergemachine.com)
    load_s3ic_x_sirene = EmbulkOperator(
        's3ic_x_sirene.yml.liquid',
        task_id='load_s3ic_x_sirene',
        env=connection_env(POSTGRES_ETL_CONN_ID))

    # Select distinct records from rubriques
    dedup_rubrique = PostgresOperator(
        task_id="dedup_rubrique",
        sql="dedup_rubrique.sql",
        postgres_conn_id=POSTGRES_ETL_CONN_ID)

    # Filter rubrique on 27__ and 35__
    filter_rubrique = PostgresOperator(
        task_id="filter_rubrique",
        sql="filter_rubrique.sql",
        postgres_conn_id=POSTGRES_ETL_CONN_ID)

    # add field category
    prepare_rubrique = PythonOperator(
        task_id="prepare_rubrique",
        python_callable=recipes.prepare_rubrique)

    # filter s3ic data on rubriques 27xx and 35xx
    filter_s3ic = PostgresOperator(
        task_id='filter_s3ic',
        sql='filter_s3ic.sql',
        postgres_conn_id=POSTGRES_ETL_CONN_ID)

    # Create IREP distinct
    dedup_irep = PostgresOperator(
        task_id="dedup_irep",
        sql="dedup_irep.sql",
        postgres_conn_id=POSTGRES_ETL_CONN_ID)

    # Stack GEREP producteurs and traiteurs
    stack_gerep = PostgresOperator(
        task_id="stack_gerep",
        sql="stack_gerep.sql",
        postgres_conn_id=POSTGRES_ETL_CONN_ID)

    # Extract GEREP distinct etablissements
    extract_gerep_etablissement = PostgresOperator(
        task_id="extract_gerep_etablissement",
        sql="extract_gerep_etablissement.sql",
        postgres_conn_id=POSTGRES_ETL_CONN_ID)

    # Join s3ic with IREP data
    join_s3ic_irep = PostgresOperator(
        task_id='join_s3ic_irep',
        sql='join_s3ic_irep.sql',
        postgres_conn_id=POSTGRES_ETL_CONN_ID)

    # Join s3ic with GEREP data
    join_s3ic_gerep = PostgresOperator(
        task_id="join_s3ic_gerep",
        sql="join_s3ic_gerep.sql",
        postgres_conn_id=POSTGRES_ETL_CONN_ID)

    # Join s3ic with s3ic_x_sirene
    join_s3ic_sirene = PostgresOperator(
        task_id="join_s3ic_sirene",
        sql="join_s3ic_sirene.sql",
        postgres_conn_id=POSTGRES_ETL_CONN_ID)

    # Rename and filter s3ic columns
    filter_s3ic_columns = PostgresOperator(
        task_id="filter_s3ic_columns",
        sql="filter_s3ic_columns.sql",
        postgres_conn_id=POSTGRES_ETL_CONN_ID)

    # Rename and filter gerep columns
    filter_gerep_columns = PostgresOperator(
        task_id="filter_gerep_columns",
        sql="filter_gerep_columns.sql",
        postgres_conn_id=POSTGRES_ETL_CONN_ID)

    # Add a '0' to code_s3ic
    prepare_gerep = PostgresOperator(
        task_id="prepare_gerep",
        sql="prepare_gerep.sql",
        postgres_conn_id=POSTGRES_ETL_CONN_ID)

    # Stage table s3ic for deployment
    stage_s3ic = CopyTableOperator(
        task_id="stage_s3ic",
        source="etl.s3ic_columns_filtered",
        destination="etl.s3ic",
        postgres_conn_id=POSTGRES_ETL_CONN_ID)

    # Stage table rubrique for deployment
    stage_rubrique = CopyTableOperator(
        task_id="stage_rubrique",
        source="etl.rubrique_prepared",
        destination="etl.rubrique",
        postgres_conn_id=POSTGRES_ETL_CONN_ID)

    # Stage table gerep for deployment
    stage_gerep = CopyTableOperator(
        task_id="stage_gerep",
        source="etl.gerep_prepared",
        destination="etl.gerep",
        postgres_conn_id=POSTGRES_ETL_CONN_ID)

    start >> [
        download_s3ic,
        download_irep,
        download_gerep,
        download_rubrique,
        download_sirene
    ]

    download_s3ic >> load_s3ic

    download_irep >> load_irep >> dedup_irep

    download_gerep >> [load_gerep_producteur, load_gerep_traiteur] \
        >> stack_gerep >> extract_gerep_etablissement

    stack_gerep >> filter_gerep_columns >> prepare_gerep >> stage_gerep

    download_rubrique >> load_rubrique >> dedup_rubrique \
        >> filter_rubrique >> prepare_rubrique >> stage_rubrique

    [load_s3ic, filter_rubrique] >> filter_s3ic

    download_sirene >> load_s3ic_x_sirene

    [dedup_irep, filter_s3ic] >> join_s3ic_irep

    [join_s3ic_irep, extract_gerep_etablissement] >> join_s3ic_gerep

    [join_s3ic_gerep, load_s3ic_x_sirene] >> join_s3ic_sirene >> \
        filter_s3ic_columns >> stage_s3ic
