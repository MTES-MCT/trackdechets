# -*- coding: utf-8 -*-

import tempfile
import os
import csv
import yaml
from datetime import datetime


from airflow import DAG
from airflow.models import TaskInstance
from airflow.operators.bash_operator import BashOperator
from airflow.hooks.postgres_hook import PostgresHook
from airflow.hooks.base_hook import BaseHook

from dags.operators.embulk import EmbulkOperator
from dags.config import TEST_DIR

from .base import BaseTestCase


class EmbulkOperatorTestCase(BaseTestCase):

    def test_execute(self):
        dag = DAG(dag_id='test', start_date=datetime.now())
        config = os.path.join(
            TEST_DIR, 'data', 'embulk', 'test.yml.liquid')
        inputfile = os.path.join(
            TEST_DIR, 'data', 'csv', 'test.csv')
        env = {'input': inputfile}

        task = EmbulkOperator(
            config=config,
            connection='postgres_etl_test',
            task_id='embulk',
            env=env,
            dag=dag)

        ti = TaskInstance(task=task, execution_date=datetime.now())
        task.execute(ti.get_template_context())

        hook = PostgresHook('postgres_etl_test')
        count = hook.get_first('SELECT count(*) from etl.test_embulk')[0]
        self.assertEqual(count, 2)

