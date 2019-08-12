# -*- coding=utf-8 -*-


from unittest import TestCase
import textwrap
import requests

from recipes.scraper import IcpeScraper


class ScraperTestCase(TestCase):

    def test_find_rubriques(self):

        url = "http://www.installationsclassees.developpement-durable" + \
              ".gouv.fr/ficheEtablissement.php?champEtablBase=30&" + \
              "champEtablNumero=12015"

        scraper = IcpeScraper(url)

        with requests.Session() as session:

            scraper.fetch_url(session)

        scraper.parse()
        scraper.find_rubriques()

        self.assertEqual(len(scraper.rubriques), 1)