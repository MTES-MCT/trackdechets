
import os.path

from airflow.operators.python_operator import PythonOperator
from airflow.hooks.postgres_hook import PostgresHook

from models import get_model


class PythonPostgresOperator(PythonOperator):
    """
    Base operator for applying a transformation
    to a PostgreSQL table using Python and Pandas
    """

    def __init__(
            self,
            input_model,
            output_model,
            **kwargs):

        self.input_model = input_model
        self.output_model = output_model

        super().__init__(**kwargs)

    def execute_callable(self):
        df = self.input_model.select()
        op_kwargs = {**self.op_kwargs, **{'df': df}}
        df_transformed = self.python_callable(*self.op_args, **op_kwargs)
        self.output_model.create_table()
        self.output_model.insert_rows(df_transformed)
        return df_transformed
