# -*- coding: utf-8 -*-

from airflow.operators.bash_operator import BashOperator
from airflow.hooks.base_hook import BaseHook

from config import EMBULK_BIN


def connection_env(connection):
    conn = BaseHook.get_connection(connection)
    return {
        'POSTGRES_HOST': conn.host,
        'POSTGRES_USER': conn.login,
        'POSTGRES_DATABASE': conn.schema,
        'POSTGRES_PASSWORD': conn.password
    }


class EmbulkOperator(BashOperator):

    def __init__(self, config, connection, env, **kwargs):
        cmd = '{embulk_bin} run {config}'.format(
            embulk_bin=EMBULK_BIN, config=config)
        env = {**connection_env(connection), **env}
        super().__init__(bash_command=cmd, env=env, **kwargs)
