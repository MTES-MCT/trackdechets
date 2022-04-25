import fs from "fs";
import { rm } from "fs/promises";
import path from "path";

import { resetDatabase } from "../../../tests/helpers";
import { siretIndexConfig, sireneIndexConfig } from "../../indexation/indexInsee.helpers";
import { unzipAndIndex } from "../../indexation/elasticSearch.helpers";
import { elasticSearchClient } from "../../common/elastic";

const csvTmp = path.join(__dirname, "..", "..", "..", "tests", "fixtures", "tmpcsv-");
const fixturesPath = [__dirname, "..", "..", "..", "tests", "fixtures"];

describe("Perform indexation", () => {
  const unzipDestination = fs.mkdtempSync(csvTmp);

  beforeAll(() => {
    delete process.env.INSEE_SIRET_ZIP_PATH;
    delete process.env.INSEE_SIRENE_ZIP_PATH;
  });

  // afterEach(resetDatabase);

  afterAll(async () => {
    await rm(`${unzipDestination}`, { recursive: true, force: true });
  });

  it("index sirene data", async () => {
    await unzipAndIndex(
      path.join(...fixturesPath, "StockUniteLegale_utf8_sample.zip"),
      unzipDestination,
      sireneIndexConfig
    );

    const searchRequest = {
      index: sireneIndexConfig.alias,
      body: {
        query: {
          match_all: {}
        }
      }
    };

    await elasticSearchClient
      .search(searchRequest)
      .then(r => {
        if (r.body.timed_out) {
          throw new Error(`Server timed out`);
        }
        if (r.warnings) {
          throw new Error(`${r.warnings}`);
        }
        expect(r.body.hits.hits).toBeInstanceOf(Array);
        expect(r.body.hits.total).toEqual(4000);
      });
  });

  it("index siret data", async () => {
    await unzipAndIndex(
      path.join(...fixturesPath, "StockEtablissement_utf8_sample.zip"),
      unzipDestination,
      siretIndexConfig
    );

    const searchRequest = {
      index: siretIndexConfig.alias,
      body: {
        query: {
          match_all: {}
        }
      }
    };

    await elasticSearchClient
      .search(searchRequest)
      .then(r => {
        if (r.body.timed_out) {
          throw new Error(`Server timed out`);
        }
        if (r.warnings) {
          throw new Error(`${r.warnings}`);
        }
        expect(r.body.hits.hits).toBeInstanceOf(Array);
        expect(r.body.hits.total).toEqual(297);
        expect(r.body.hits.hits).toEqual(expect.arrayContaining(
          expect.objectContaining({
            _source: {
              siren: '005410345',
              nic: '00010',
              siret: '00541034500010',
              statutDiffusionEtablissement: 'O',
              dateCreationEtablissement: '',
              trancheEffectifsEtablissement: '',
              anneeEffectifsEtablissement: '',
              activitePrincipaleRegistreMetiersEtablissement: '',
              dateDernierTraitementEtablissement: '',
              etablissementSiege: 'true',
              nombrePeriodesEtablissement: '1',
              complementAdresseEtablissement: '',
              numeroVoieEtablissement: '',
              indiceRepetitionEtablissement: '',
              typeVoieEtablissement: 'RTE',
              libelleVoieEtablissement: 'DE DOULLENS',
              codePostalEtablissement: '80100',
              libelleCommuneEtablissement: 'ABBEVILLE',
              libelleCommuneEtrangerEtablissement: '',
              distributionSpecialeEtablissement: '',
              codeCommuneEtablissement: '80001',
              codeCedexEtablissement: '',
              libelleCedexEtablissement: '',
              codePaysEtrangerEtablissement: '',
              libellePaysEtrangerEtablissement: '',
              complementAdresse2Etablissement: '',
              numeroVoie2Etablissement: '',
              indiceRepetition2Etablissement: '',
              typeVoie2Etablissement: '',
              libelleVoie2Etablissement: '',
              codePostal2Etablissement: '',
              libelleCommune2Etablissement: '',
              libelleCommuneEtranger2Etablissement: '',
              distributionSpeciale2Etablissement: '',
              codeCommune2Etablissement: '',
              codeCedex2Etablissement: '',
              libelleCedex2Etablissement: '',
              codePaysEtranger2Etablissement: '',
              libellePaysEtranger2Etablissement: '',
              dateDebut: '1984-12-25',
              etatAdministratifEtablissement: 'F',
              enseigne1Etablissement: '',
              enseigne2Etablissement: '',
              enseigne3Etablissement: '',
              denominationUsuelleEtablissement: '',
              activitePrincipaleEtablissement: '79.06',
              nomenclatureActivitePrincipaleEtablissement: 'NAP',
              caractereEmployeurEtablissement: 'N',
              statutDiffusionUniteLegale: 'O',
              unitePurgeeUniteLegale: 'true',
              dateCreationUniteLegale: '',
              sigleUniteLegale: '',
              sexeUniteLegale: 'M',
              prenom1UniteLegale: 'MICHEL',
              prenom2UniteLegale: '',
              prenom3UniteLegale: '',
              prenom4UniteLegale: '',
              prenomUsuelUniteLegale: 'MICHEL',
              pseudonymeUniteLegale: '',
              identifiantAssociationUniteLegale: '',
              trancheEffectifsUniteLegale: '',
              anneeEffectifsUniteLegale: '',
              dateDernierTraitementUniteLegale: '',
              nombrePeriodesUniteLegale: '1',
              categorieEntreprise: '',
              anneeCategorieEntreprise: '',
              etatAdministratifUniteLegale: 'C',
              nomUniteLegale: 'DEBRAY',
              nomUsageUniteLegale: '',
              denominationUniteLegale: '',
              denominationUsuelle1UniteLegale: '',
              denominationUsuelle2UniteLegale: '',
              denominationUsuelle3UniteLegale: '',
              categorieJuridiqueUniteLegale: '1000',
              activitePrincipaleUniteLegale: '79.06',
              nomenclatureActivitePrincipaleUniteLegale: 'NAP',
              nicSiegeUniteLegale: '00010',
              economieSocialeSolidaireUniteLegale: '',
              caractereEmployeurUniteLegale: 'N'
            }
          })
        ));
      });
  });
});
