
import os
from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.python_operator import PythonOperator, \
    BranchPythonOperator
from airflow.operators.postgres_operator import PostgresOperator
from airflow.operators.dummy_operator import DummyOperator
from airflow.hooks.data_preparation import PostgresDataset

from operators.shp2pgsql import Shp2pgsqlOperator
from operators.embulk import EmbulkOperator
from operators.python_postgres import PythonPostgresOperator
from operators.download import DownloadUnzipOperator

from models import S3ICFiltered, RubriquesScraped
from config import ENV, SQL_DIR, EMBULK_DIR, DATA_DIR, S3IC_SHP_URL, \
                   RUBRIQUE_SCRAPED_CSV_URL, IREP_CSV_URL
from recipes.scraper import download_rubriques
import python_recipes as recipes


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


connection = 'postgres_etl'


with DAG("consolidate",
         default_args=default_args,
         schedule_interval="@once",
         template_searchpath=SQL_DIR,
         dagrun_timeout=timedelta(hours=24)) as dag:

    start = DummyOperator(task_id="start")

    # Download s3ic data from georisques
    download_s3ic = DownloadUnzipOperator(
        task_id="download_s3ic",
        url=S3IC_SHP_URL,
        path=DATA_DIR)

    # Load s3ic data
    s3ic_shapefile = os.path.join(DATA_DIR, 's3ic', 'ICPE_4326.shp')
    load_s3ic = Shp2pgsqlOperator(
        task_id='load_s3ic',
        shapefile=s3ic_shapefile,
        table='etl.s3ic',
        connection=connection)

    # Download rubriques ICPE for 27xx and 35xx
    # from installationsclassées
    download_rubriques_op = PythonOperator(
        task_id="download_rubriques",
        python_callable=download_rubriques,
        op_args=[DATA_DIR])

    # Load rubriques
    config = os.path.join(EMBULK_DIR, 'rubriques.yml.liquid')
    path_prefix = os.path.join(DATA_DIR, 's3ic', 'rubriques')
    env = {'PATH_PREFIX': path_prefix}
    load_rubriques = EmbulkOperator(
        task_id='load_rubriques',
        config=config,
        connection=connection,
        env=env)

    # Create table s3ic_filtered
    create_s3ic_filtered = PostgresOperator(
        task_id='create_s3ic_filtered',
        sql='schemas/s3ic_filtered.sql',
        postgres_conn_id=connection)

    # filter s3ic data on rubriques 27xx and 35xx
    filter_s3ic = PostgresOperator(
        task_id='filter_s3ic',
        sql='recipes/filter_s3ic.sql',
        postgres_conn_id=connection)

    # Scrap rubriques for thoses installations
    # because we are missing some info
    scrap_rubriques = PythonOperator(
        task_id="scrap_rubriques",
        python_callable=recipes.scrap_rubriques
    )

    # Download scraped rubriques data
    download_rubriques_scraped = DownloadUnzipOperator(
        task_id="download_rubriques_scraped",
        url=RUBRIQUE_SCRAPED_CSV_URL,
        path=os.path.join(DATA_DIR, 's3ic'))

    # Load scraped rubriques data
    config = os.path.join(EMBULK_DIR, 'rubriques_scraped.yml.liquid')
    path_prefix = os.path.join(DATA_DIR, 's3ic', 'rubriques_scraped')
    env = {'PATH_PREFIX': path_prefix}
    load_rubriques_scraped = EmbulkOperator(
        task_id='load_rubriques_scraped',
        config=config,
        connection=connection,
        env=env)

    # Only scrap data in local mode (taking too much time)
    # Otherwise download data from a previous build
    def branch_func():
        if ENV == "local":
            return "scrap_rubriques"
        else:
            return "download_rubriques_scraped"

    branching = BranchPythonOperator(
        task_id="branching",
        python_callable=branch_func)

    join = DummyOperator(
        task_id="join",
        trigger_rule="one_success")

    # Create table rubriques_scraped_distinct
    create_rubriques_scraped_distinct = PostgresOperator(
        task_id="create_rubriques_scraped_distinct",
        sql="schemas/rubriques_scraped_distinct.sql",
        postgres_conn_id=connection)

    # Select distinct records from rubriques_scraped
    set_rubriques_scraped_distinct = PostgresOperator(
        task_id="set_rubriques_scraped_distinct",
        sql="recipes/set_rubriques_scraped_distinct.sql",
        postgres_conn_id=connection)

    # Create table rubriques_prepared
    create_rubriques_prepared = PostgresOperator(
        task_id="create_rubriques_prepared",
        sql="schemas/rubriques_prepared.sql",
        postgres_conn_id=connection)

    # Copy data from rubriques_scraped_distinct into rubriques_prepared
    copy_to_rubriques_prepared = PostgresOperator(
        task_id="copy_to_rubriques_prepared",
        sql="recipes/copy_to_rubriques_prepared.sql",
        postgres_conn_id=connection)

    # Download IREP data
    download_irep = DownloadUnzipOperator(
        task_id="download_irep",
        url=IREP_CSV_URL,
        path=DATA_DIR)

    # Load IREP data
    config = os.path.join(EMBULK_DIR, 'irep.yml.liquid')
    path_prefix = os.path.join(DATA_DIR, 'irep')
    env = {'PATH_PREFIX': path_prefix}
    load_irep = EmbulkOperator(
        task_id='load_irep',
        config=config,
        connection=connection,
        env=env)

    # Create IREP distinct
    create_irep_distinct = PostgresOperator(
        task_id="create_irep_distinct",
        sql="schemas/irep_distinct.sql",
        postgres_conn_id=connection)

    # Set IREP distinct
    set_irep_distinct = PostgresOperator(
        task_id="set_irep_distinct",
        sql="recipes/set_irep_distinct.sql",
        postgres_conn_id=connection)

    # Join s3ic with IREP data
    create_s3ic_join_irep = PostgresOperator(
        task_id='create_s3ic_join_irep',
        sql='schemas/s3ic_join_irep.sql',
        postgres_conn_id=connection)

    join_s3ic_irep = PostgresOperator(
        task_id='join_s3ic_irep',
        sql='recipes/join_s3ic_irep.sql',
        postgres_conn_id=connection)

    # Insert data into final table
    create_s3ic_consolidated = PostgresOperator(
        task_id='create_s3ic_consolidated',
        sql='schemas/s3ic_consolidated.sql',
        postgres_conn_id=connection)

    copy_to_s3ic_consolidated = PostgresOperator(
        task_id='copy_to_s3ic_consolidated',
        sql='recipes/copy_to_s3ic_consolidated.sql',
        postgres_conn_id=connection)

    start >> [download_s3ic, download_rubriques_op, download_irep]

    download_irep >> load_irep >> create_irep_distinct >> set_irep_distinct

    download_s3ic >> load_s3ic

    download_rubriques_op >> load_rubriques

    [load_s3ic, load_rubriques] >> create_s3ic_filtered >> filter_s3ic

    filter_s3ic >> branching

    branching >> scrap_rubriques >> create_rubriques_scraped_distinct >> \
        set_rubriques_scraped_distinct >> join

    branching >> download_rubriques_scraped >> \
        load_rubriques_scraped >> join

    join >> create_rubriques_prepared >> \
        copy_to_rubriques_prepared

    [filter_s3ic, set_irep_distinct] >> create_s3ic_join_irep >> join_s3ic_irep

    join_s3ic_irep >> create_s3ic_consolidated

    create_s3ic_consolidated >> copy_to_s3ic_consolidated
