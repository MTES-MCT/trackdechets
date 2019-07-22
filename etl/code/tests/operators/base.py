import logging
import sys
from unittest import TestCase

class BaseTestCase(TestCase):

    def setUp(self):
        log = logging.getLogger("airflow.task.operators")
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.INFO)
        log.addHandler(handler)
