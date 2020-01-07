# -*- coding=utf-8 -*-

from airflow.hooks.base_hook import BaseHook


def connection_env(connection):
    conn = BaseHook.get_connection(connection)

    return {
        'POSTGRES_HOST': conn.host,
        'POSTGRES_USER': conn.login,
        'POSTGRES_DATABASE': conn.schema,
        'POSTGRES_PASSWORD': conn.password,
        'POSTGRES_PORT': str(conn.port)
    }
