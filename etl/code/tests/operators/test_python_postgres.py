# -*- coding: utf-8 -*-

import tempfile
import os
import csv
import yaml
from datetime import datetime
from unittest import mock

from airflow import DAG
from airflow.models import TaskInstance
from airflow.hooks.postgres_hook import PostgresHook
from airflow.hooks.base_hook import BaseHook

import pandas as pd

from dags.operators.python_postgres import PythonPostgresOperator

from .base import BaseTestCase
from dags.models import Model


class Foo(Model):
    table = 'foo'


class Bar(Model):
    table = 'bar'


class PythonPostgresOperatorTestCase(BaseTestCase):

    @mock.patch.object(Foo, 'schema', new_callable=mock.PropertyMock)
    @mock.patch.object(Bar, 'schema',  new_callable=mock.PropertyMock)
    def test_execute(self, mock_bar_schema, mock_foo_schema):

        dag = DAG(dag_id='test', start_date=datetime.now())

        def python_callable(df):
            df['bar'] = df['foo'] * 2
            df = df.drop('foo', axis=1)
            return df

        connection = 'postgres_etl_test'

        input_schema = """
            CREATE TABLE etl.foo
            (
                id SERIAL PRIMARY KEY,
                foo NUMERIC
            );
        """
        mock_foo_schema.return_value = input_schema
        input_model = Foo(connection)


        output_schema = """
            CREATE TABLE etl.bar
            (
                id SERIAL PRIMARY KEY,
                bar NUMERIC
            );
        """
        mock_bar_schema.return_value = output_schema
        output_model = Bar(connection)

        input_model.create_table()

        task = PythonPostgresOperator(
            task_id='python_postgres',
            input_model=input_model,
            output_model=output_model,
            python_callable=python_callable,
            dag=dag)

        records = [{'foo': 1}]
        df = pd.DataFrame.from_records(records)
        input_model.insert_rows(df)

        ti = TaskInstance(task=task, execution_date=datetime.now())
        task.execute(ti.get_template_context())

        hook = PostgresHook('postgres_etl_test')
        bar = hook.get_first('SELECT bar from etl.bar')[0]
        self.assertEqual(bar, 2)

