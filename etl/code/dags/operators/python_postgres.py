
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
            batch=None,
            **kwargs):

        self.input_model = input_model
        self.output_model = output_model
        self.batch = batch
        super().__init__(**kwargs)

    def execute_callable(self):
        self.output_model.create_table()
        df = self.input_model.select()

        def inner(df):
            op_kwargs = {**self.op_kwargs, **{'df': df}}
            df_transformed = self.python_callable(*self.op_args, **op_kwargs)
            self.output_model.insert_rows(df_transformed)

        if self.batch:
            list_df = [
                df[i:i+self.batch]
                for i
                in range(0, df.shape[0], self.batch)]
            for df in list_df:
                inner(df)
        else:
            inner(df)
