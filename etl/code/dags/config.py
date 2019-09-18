# -*- coding=utf-8 -*-


import os


class ImproperlyConfigured(Exception):
    pass


def get_env_setting(setting):
    """ Get the environment setting or return exception """
    try:
        return os.environ[setting]
    except KeyError:
        error_msg = "Set the %s env variable" % setting
        raise ImproperlyConfigured(error_msg)


# Postgres
POSTGRES_ETL_CONN_ID = 'postgres_etl'
POSTGRES_PRISMA_CONN_ID = 'postgres_prisma'

# Folder structure

DATA_DIR = get_env_setting("DATA_DIR")

SQL_DIR = get_env_setting("SQL_DIR")


# Data
DOWNLOAD_URL = "https://trackdechets.fra1.digitaloceanspaces.com"
