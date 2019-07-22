# -*- coding: utf-8 -*-

from datetime import datetime
import os

from airflow import DAG
from airflow.models import TaskInstance
from airflow.operators.bash_operator import BashOperator
from airflow.hooks.postgres_hook import PostgresHook

from dags.operators.shp2pgsql import Shp2pgsqlOperator
from dags.config import TEST_DIR

from .base import BaseTestCase


class Shp2pgsqlOperatorTestCase(BaseTestCase):

    def setUp(self):
        super().setUp()
        self.shapefile = os.path.join(TEST_DIR, 'data', 'icpe', 'guadeloupe.shp')
        self.table = 'etl.guadeloupe'

    def test_execute(self):
        dag = DAG(dag_id='test', start_date=datetime.now())
        task = Shp2pgsqlOperator(
            self.shapefile,
            self.table,
            task_id='shp2pgsql',
            connection='postgres_etl_test',
            dag=dag)
        ti = TaskInstance(task=task, execution_date=datetime.now())

        task.execute(ti.get_template_context())

        db = PostgresHook('postgres_etl_test')

        count = db.get_first('SELECT COUNT(*) from %s;' % self.table)[0]

        self.assertEqual(count, 148)

