# -*- coding=utf-8 -*-

import asyncio
from concurrent.futures import ThreadPoolExecutor
import textwrap
import os
from urllib.parse import urljoin
from urllib.request import urlretrieve

import pandas as pd
import requests
from bs4 import BeautifulSoup


rubriques_dechets = ['2710', '2711', '2712', '2713', '2714', '2715', '2716',
                     '2717', '2718', '2719', '2720', '2730', '2731', '2740',
                     '2750', '2751', '2752', '2760', '2770', '2771', '2780',
                     '2781', '2782', '2790', '2791', '2792', '2793', '2794',
                     '2795', '2797', '2798', '2799', '3510', '3520', '3531',
                     '3532', '3540', '3550', '3560']


def download_rubriques(dir_path):
    for rubrique in rubriques_dechets:
        base_url = urljoin(
            "http://www.installationsclassees.developpement-durable.gouv.fr",
            "ic_export.php")
        params = {"champListeIC": "%27{r}%27".format(r=rubrique)}
        url = "{base_url}?&champListeIC=%27{rubrique}%27" \
            .format(base_url=base_url, rubrique=rubrique)
        rubriques_dir = os.path.join(dir_path, "s3ic", "rubriques")
        try:
            os.makedirs(rubriques_dir)
        except FileExistsError:
            # directory data_dir/s3ic/rubriques already exists
            pass
        filepath = os.path.join(dir_path, "s3ic", "rubriques",
                                "{rubrique}.csv".format(rubrique=rubrique))
        urlretrieve(url, filepath)

RUBRIQUE = 'Rubri. IC'
ALINEA = 'Ali.'
DATE_AUTORISATION = 'Date auto.'
ETAT_ACTIVITE = 'Etat d\'activité'
REGIME_AUTORISE = 'Régime autorisé(3)'
ACTIVITE = 'Activité'
VOLUME = 'Volume'
UNITE = 'Unité'


def parse_row(row):
    return {
        'rubrique': row[RUBRIQUE],
        'alinea': row[ALINEA],
        'date_autorisation': row[DATE_AUTORISATION],
        'etat_activite': row[ETAT_ACTIVITE],
        'regime_autorise': row[REGIME_AUTORISE],
        'activite': row[ACTIVITE],
        'volume': row[VOLUME],
        'unite': row[UNITE]}


def scrap_rubriques(df):
    urls = df['url_fiche'].tolist()
    scrapers = [IcpeScraper(url) for url in urls]
    fetch_parallel(scrapers)
    for scraper in scrapers:
        scraper.parse()
        scraper.find_rubriques()
    rubriques_list = [scraper.rubriques for scraper in scrapers]
    codes_s3ic = df['code_s3ic'].tolist()
    codes_s3ic_zip_rubriques = list(zip(codes_s3ic, rubriques_list))
    rubriques = []
    for (code_s3ic, rs) in codes_s3ic_zip_rubriques:
        for r in rs:
            parsed = parse_row(r)
            if parsed['rubrique'] in rubriques_dechets:
                row = {'code_s3ic': code_s3ic, **parsed}
                rubriques.append(row)
    df = pd.DataFrame.from_records(rubriques)
    return df


def fetch_parallel(scrapers):

    async def inner():

        with ThreadPoolExecutor(max_workers=5) as executor:

            with requests.Session() as session:

                loop = asyncio.get_event_loop()

                tasks = [
                    loop.run_in_executor(
                        executor,
                        scraper.fetch_url,
                        session
                    )
                    for scraper in scrapers
                ]

                return await asyncio.gather(*tasks)

    loop = asyncio.get_event_loop()
    loop.run_until_complete(inner())


class HtmlNotSetException(Exception):

    def __init__(self):
        msg = 'Html not set, make sure to call `fetch_url` before'
        super().__init__(msg)


class SoupNotSetException(Exception):

    def __init__(self):
        msg = 'Soup not set, make sure to call `fetch_url` and `parse` before'
        super().__init__(msg)


class IcpeScraper():
    """
    Scraper used to retrieve the rubriques from an icpe
    detail page like this one
    http://www.installationsclassees.developpement-durable.gouv.fr/
    ficheEtablissement.php?champEtablBase=30&champEtablNumero=12015
    """

    def __init__(self, url):
        self.url = url
        self.html = None
        self.soup = None
        self.rubriques = []

    def fetch_url(self, session):
        """ fetch an url and set the html field """
        response = session.get(self.url)
        if response.status_code != 200:
            print('Failure %s' % self.url)
            print(response.status_code)
        self.html = response.text

    def parse(self):
        """ parse the html using BeautifulSoup """
        if not self.html:
            raise HtmlNotSetException()
        self.soup = BeautifulSoup(self.html, 'html5lib')

    def find_rubriques(self):
        """ find the rubriques in the html tree """
        if not self.soup:
            raise SoupNotSetException()
        h2 = self.soup.find('h2', text='Situation administrative')
        table = h2.find_next('table')
        tbody = table.find('tbody')
        ths = tbody.find_all('th')
        headers = []
        for th in ths:
            headers.append(th.text.strip())
        trs = tbody.find_all('tr')
        rows = []
        for tr in trs:
            tds = tr.find_all('td')
            if len(tds) > 0:
                cells = []
                for td in tds:
                    cells.append(td.text)
                row = dict(zip(headers, cells))
                rows.append(row)
        self.rubriques = rows
