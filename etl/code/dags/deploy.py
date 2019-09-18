# -*- coding=utf-8 -*-

"""
This DAG is used to copy data from tables in the
etl database to tables in the database managed
by prisma. It should be run once the DAG consolidate
has succeeded
"""

from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.dummy_operator import DummyOperator
from airflow.operators.python_operator import PythonOperator
from airflow.operators.postgres_operator import PostgresOperator

import python_recipes as recipes

from config import POSTGRES_PRISMA_CONN_ID, SQL_DIR


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


with DAG("deploy",
         default_args=default_args,
         template_searchpath=SQL_DIR,
         schedule_interval=None) as dag:

    start = DummyOperator(task_id="start")

    deploy_s3ic = PythonOperator(
        task_id="deploy_s3ic",
        python_callable=recipes.deploy_s3ic)

    deploy_rubrique = PythonOperator(
        task_id="deploy_rubrique",
        python_callable=recipes.deploy_rubrique)

    deploy_gerep = PythonOperator(
        task_id="deploy_gerep",
        python_callable=recipes.deploy_gerep)

    create_indexes = PostgresOperator(
        task_id="create_indexes",
        sql="create_indexes.sql",
        postgres_conn_id=POSTGRES_PRISMA_CONN_ID)

    start >> [deploy_s3ic, deploy_rubrique, deploy_gerep] >> create_indexes
