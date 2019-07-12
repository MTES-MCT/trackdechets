
from unittest import TestCase, mock

from dags.recipes.scraper import IcpeScraper, fetch_parallel


class IcpeScraperTestCase(TestCase):

    @mock.patch('dags.recipes.scraper.requests.Session')
    def test_fetch_parallel(self, mock_Session):

        mock_response = mock.Mock()
        mock_response.status_code = 200
        mock_response.text = 'some html'
        mock_Session.return_value.__enter__. \
            return_value.get.return_value = mock_response

        scraper1 = IcpeScraper('url1')
        scraper2 = IcpeScraper('url2')
        scrapers = [scraper1, scraper2]
        fetch_parallel(scrapers)
        self.assertIsNotNone(scraper1.html)
        self.assertIsNotNone(scraper2.html)

    def test_find_rubriques(self):
        """ it should retrieve icpe rubriques in html tree view """
        scraper = IcpeScraper('url')

        scraper.html = """
        <h2>Situation administrative</h2>
        <br>
        <div class="listeEtabl">
            <table border="1" cellpadding="2px" class="listeEtabl" summary="liste des résultats">
                <tbody><tr class="listeEtablenTete">
                    <th title="Rubrique IC">Rubri. IC
                    </th><th title="Alinéa">Ali.
                    </th><th title="Date d'autorisation">Date auto.
                    </th><th>Etat d'activité
                    </th><th title="Régime">Régime autorisé<sup>(3)</sup>
                    </th><th>Activité
                    </th><th>Volume
                    </th><th>Unité
                </th></tr>
                <tr class="listeEtabl1">
                    <td><a href="http://www.ineris.fr/aida/textes/nomenclature/rubriques/rub_2760.htm" target="_blank">2760</a></td>
                    <td>3</td>
                    <td>10/06/2009</td>
                    <td title="En fonctionnement">En fonct.</td>
                    <td>E</td>
                    <td>Installations de stockage de déchets inertes</td>
                    <td align="right">1400000</td>
                    <td> </td>
                </tr>
            </tbody></table>
        </div>
        """
        scraper.parse()
        scraper.find_rubriques()

        expected = [
            {
                'Rubri. IC': '2760',
                'Ali.': '3',
                'Date auto.': '10/06/2009',
                "Etat d'activité": 'En fonct.',
                'Régime autorisé(3)': 'E',
                'Activité': 'Installations de stockage de déchets inertes',
                'Volume': '1400000', 'Unité': ' '
            }
        ]
        self.assertEqual(scraper.rubriques, expected)