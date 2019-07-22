# -*- coding: utf-8 -*-

import subprocess
import tempfile
import os

from airflow.operators.bash_operator import BashOperator
from airflow.hooks.base_hook import BaseHook


class Shp2pgsqlOperator(BashOperator):

    def __init__(self, shapefile, table, connection, **kwargs):
        conn = BaseHook.get_connection(connection)
        cmd_args = [
            'shp2pgsql',
            '-d',
            shapefile,
            table,
            '|',
            'PGPASSWORD=%s' % conn.password,
            'psql',
            '--host=%s' % conn.host,
            '--username=%s' % conn.login,
            '--dbname=%s' % conn.schema]
        cmd = ' '.join(cmd_args)
        super().__init__(bash_command=cmd, **kwargs)




