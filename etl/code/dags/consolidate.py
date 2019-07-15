
import os
from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.python_operator import PythonOperator
from airflow.operators.postgres_operator import PostgresOperator
from airflow.operators.dummy_operator import DummyOperator

from operators.shp2pgsql import Shp2pgsqlOperator
from operators.embulk import EmbulkOperator
from operators.python_postgres import PythonPostgresOperator
from operators.download import DownloadUnzipOperator

from models import S3IC, Rubrique
from config import SQL_DIR, EMBULK_DIR, DATA_DIR, S3IC_SHP_URL, RUBRIQUE_CSV_URL
from recipes.scraper import scrap_rubriques


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

    # Scrap rubriques ICPE
    # input_model = S3IC(connection)
    # output_model = Rubrique(connection)

    # scrap_rubriques = PythonPostgresOperator(
    #     task_id='scrap_rubriques',
    #     input_model=input_model,
    #     output_model=output_model,
    #     python_callable=scrap_rubriques,
    #     execution_timeout=timedelta(hours=6))

    # Download rubriques data
    download_s3ic = DownloadUnzipOperator(
        task_id="download_rubrique",
        url=RUBRIQUE_CSV_URL,
        path=DATA_DIR)

    # Load rubriques ICPE
    config = os.path.join(EMBULK_DIR, 'rubrique.yml.liquid')
    path_prefix = os.path.join(DATA_DIR, 'rubrique')
    env = {'PATH_PREFIX': path_prefix}
    load_rubrique = EmbulkOperator(
        task_id='load_rubrique',
        config=config,
        connection=connection,
        env=env)

    # Filter s3ic on rubriques 27xx and 35xx
    # create_s3ic_filtered = PostgresOperator(
    #     task_id='create_s3ic_filtered',
    #     sql='schemas/s3ic_filtered.sql',
    #     postgres_conn_id=connection)

    # filter_s3ic = PostgresOperator(
    #     task_id='filter_s3ic',
    #     sql='recipes/filter_s3ic.sql',
    #     postgres_conn_id=connection)

    # Load IREP data
    config = os.path.join(EMBULK_DIR, 'irep.yml.liquid')
    path_prefix = os.path.join(DATA_DIR, 'irep', '2017', 'etablissements.csv')
    env = {'PATH_PREFIX': path_prefix}
    load_irep = EmbulkOperator(
        task_id='load_irep',
        config=config,
        connection=connection,
        env=env)

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


    # start >> [load_s3ic, load_irep]
    # load_s3ic >> scrap_rubriques >> create_s3ic_filtered >> filter_s3ic
    # load_irep >> create_s3ic_join_irep
    # join_s3ic_irep << [filter_s3ic, create_s3ic_join_irep]


    start \
    >> download_s3ic \
    >> [load_s3ic, load_irep] \
    >> create_s3ic_join_irep \
    >> join_s3ic_irep \
    >> create_s3ic_consolidated \
    >> copy_to_s3ic_consolidated

