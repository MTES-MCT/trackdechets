# -*- coding: utf-8 -*-

import textwrap

from airflow.operators.bash_operator import BashOperator
from airflow.hooks.base_hook import BaseHook

from config import SCRIPT_DIR


class DownloadUnzipOperator(BashOperator):

    def __init__(self, url, path, **kwargs):
        bash_command = textwrap.dedent("""
            TMPFILE=`mktemp`
            PWD=`pwd`
            wget "%s" -O $TMPFILE
            mkdir -p %s
            unzip -o -d %s $TMPFILE""" % (url, path, path)
        )
        super().__init__(bash_command=bash_command, **kwargs)
