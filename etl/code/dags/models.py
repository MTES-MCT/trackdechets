
import os

from airflow.hooks.postgres_hook import PostgresHook

from config import SQL_DIR


def get_schema(table):
    filename = '%s.sql' % table
    schema_file = os.path.join(SQL_DIR, 'schemas', filename)
    with open(schema_file, 'r') as f:
        return f.read()


class Model():
    """
    Thin wrapper around PostgresHook
    that associate a table with a
    schema
    """

    def __init__(self, connection):
        connection = connection
        self.hook = PostgresHook(connection)

    @property
    def schema(self):
        """ returns the sql schema of a table """
        return get_schema(self.table)

    def create_table(self):
        """ create a PostgreSQL table """
        self.hook.run(self.schema)

    def select(self):
        """
        select all records from the table and return
        a pandas dataframe
        """
        sql = 'SELECT * from etl.%s' % self.table
        return self.hook.get_pandas_df(sql)

    def insert_rows(self, df):
        target_fields = list(df.columns)
        rows = df.values.tolist()
        table_name = 'etl.%s' % self.table
        self.hook.insert_rows(table_name, rows, target_fields=target_fields)


class S3IC(Model):

    table = 's3ic'


class S3ICFiltered(Model):

    table = 's3ic_filtered'


class Rubriques(Model):

    table = 'rubriques'


class RubriquesScraped(Model):

    table = 'rubriques_scraped'


_models = dict([(model.table, model) for model in [S3IC]])


class ModelNotFoundException(Exception):

    def __init__(self, table, *args, **kwargs):
        msg = 'Could not find any model for table %s' % table
        super().__init__(msg, *args, **kwargs)


def get_model(table):
    model = _models.get(table)
    if model is None:
        raise ModelNotFoundException(table)
    else:
        return model


