import os
import textwrap


class ImproperlyConfigured(Exception):
    pass


def get_env_setting(setting):
    """ Get the environment setting or return exception """
    try:
        return os.environ[setting]
    except KeyError:
        error_msg = "Set the %s env variable" % setting
        raise ImproperlyConfigured(error_msg)


# Folder structure

CWD = os.getcwd()

DATA_DIR = os.path.join(CWD, 'data')

TEST_DIR = os.path.join(CWD, 'tests')

SQL_DIR = os.path.join(CWD, 'sql')

SCRIPT_DIR = os.path.join(CWD, 'scripts')

# Embulk

EMBULK_DIR = os.path.join(CWD, 'embulk')

EMBULK_BIN = get_env_setting('EMBULK_BIN')

# Data
S3IC_SHP_URL = "https://benoitguigal.fra1.digitaloceanspaces.com/s3ic.zip"