
from airflow.hooks.postgres_hook import PostgresHook


def teardown_db():
    """ Drop test database """

    db = PostgresHook('postgres_etl')
    test_db = PostgresHook('postgres_etl_test')
    test_conn = test_db.get_connection('postgres_etl_test')

    drop_stmt = 'DROP DATABASE IF EXISTS %s' % test_conn.schema
    db.run(drop_stmt, autocommit=True)


if __name__ == '__main__':
    teardown_db()