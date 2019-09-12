# -*- coding=utf-8 -*-

from unittest import TestCase

from utils import get_rubrique_info


class UtilsTestCase(TestCase):

    def test_get_rubrique_info(self):

        info = get_rubrique_info("2710", "1a")
        self.assertEqual(info.category, "WASTE_CENTER")
        self.assertEqual(info.waste_type, "DANGEROUS")

        info = get_rubrique_info("2715")
        self.assertEqual(info.category, "COLLECTOR")
        self.assertEqual(info.waste_type, "NOT_DANGEROUS")

        info = get_rubrique_info("2715", "1")
        self.assertEqual(info.category, "COLLECTOR")
        self.assertEqual(info.waste_type, "NOT_DANGEROUS")

        info = get_rubrique_info("2716", "3")
        self.assertIsNone(info)

        info = get_rubrique_info("4560")
        self.assertIsNone(info)