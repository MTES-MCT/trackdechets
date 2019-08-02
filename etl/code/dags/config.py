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

# Environment
ENV = get_env_setting('ENV')

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

base_url = "https://trackdechets.fra1.digitaloceanspaces.com"

S3IC_SHP_URL = "%s/s3ic.zip" % base_url

RUBRIQUE_SCRAPED_CSV_URL = "%s/rubriques_scraped.zip" % base_url

IREP_CSV_URL = "%s/irep.zip" % base_url
