
import tempfile
import textwrap
import os
from unittest import TestCase, mock

import pandas as pd

from dags.models import Model


class ModelTestCase(TestCase):

    def setUp(self):

        class Foo(Model):
            table = 'foo'

        connection = 'postgres_etl_test'

        self.model = Foo(connection)

        schema = textwrap.dedent("""
            DROP TABLE IF EXISTS etl.foo;

            CREATE TABLE etl.foo
            (
                id SERIAL PRIMARY KEY,
                field VARCHAR(255)
            )""")
        with tempfile.NamedTemporaryFile('w', delete=False, suffix='.sql') as f:
            self.tempfile = f
            self.tempfile.write(schema)

    def tearDown(self):
        os.remove(self.tempfile.name)

    @mock.patch('dags.models.get_schema')
    def test_create_table_insert_select(self, mock_get_schema):
        with open(self.tempfile.name, 'r') as f:
            mock_get_schema.return_value = f.read()
        self.model.create_table()
        data = {'field': ['foo', 'bar']}
        df = pd.DataFrame.from_dict(data)
        self.model.insert_rows(df)
        data = self.model.select().to_dict(orient='records')
        expected = [{'id': 1, 'field': 'foo'}, {'id': 2, 'field': 'bar'}]
        self.assertEqual(data, expected)








