
from airflow.hooks.postgres_hook import PostgresHook


def setup_db():
    """ create test database and etl schema """

    db = PostgresHook('postgres_etl')

    test_db = PostgresHook('postgres_etl_test')
    test_conn = test_db.get_connection('postgres_etl_test')

    drop_stmt = 'DROP DATABASE IF EXISTS %s' % test_conn.schema
    db.run(drop_stmt, autocommit=True)
    create_stmt = 'CREATE DATABASE %s' % test_conn.schema
    db.run(create_stmt, autocommit=True)

    postgis_stmt = 'CREATE EXTENSION postgis'
    test_db.run(postgis_stmt)

    schema_stmt = 'CREATE SCHEMA etl'
    test_db.run(schema_stmt)


if __name__ == '__main__':
    setup_db()
