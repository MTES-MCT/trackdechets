import { elasticSearchClient as client } from "..";
import {
  ElasticBulkNonFlatPayload,
  IndexProcessConfig
} from "./types";
import { logger } from "..";


// Date dynamic mapping for all field names starting with "date*""
// like "dateDernierTraitementUniteLegale"
export const standardMapping = {
  _doc: {
    dynamic_templates: [
      {
        dateType: {
          match_pattern: "regex",
          match: "^date.*$",
          mapping: {
            type: "date",
            ignore_malformed: true
          }
        }
      }
    ]
  }
};

export const INDEX_ALIAS_NAME_SEPARATOR = "-";
export const INDEX_NAME_INSEE_PREFIX = "stock";

/**
 * stockunitelegale-* indexation config
 */
export const sireneIndexConfig: IndexProcessConfig = {
  alias: `${INDEX_NAME_INSEE_PREFIX}unitelegale${INDEX_ALIAS_NAME_SEPARATOR}${
    process.env.NODE_ENV ? process.env.NODE_ENV : "dev"
  }${
    process.env.INDEX_ALIAS_NAME_SUFFIX
      ? process.env.INDEX_ALIAS_NAME_SUFFIX
      : ""
  }`,
  // to match the filename inside zip
  csvFileName: "StockUniteLegale_utf8.csv",
  // zip target filename
  zipFileName: "StockUniteLegale_utf8.zip",
  idKey: "siren",
  mappings: standardMapping,
  headers: [
    "siren",
    "statutDiffusionUniteLegale",
    "unitePurgeeUniteLegale",
    "dateCreationUniteLegale",
    "sigleUniteLegale",
    "sexeUniteLegale",
    "prenom1UniteLegale",
    "prenom2UniteLegale",
    "prenom3UniteLegale",
    "prenom4UniteLegale",
    "prenomUsuelUniteLegale",
    "pseudonymeUniteLegale",
    "identifiantAssociationUniteLegale",
    "trancheEffectifsUniteLegale",
    "anneeEffectifsUniteLegale",
    "dateDernierTraitementUniteLegale",
    "nombrePeriodesUniteLegale",
    "categorieEntreprise",
    "anneeCategorieEntreprise",
    "dateDebut",
    "etatAdministratifUniteLegale",
    "nomUniteLegale",
    "nomUsageUniteLegale",
    "denominationUniteLegale",
    "denominationUsuelle1UniteLegale",
    "denominationUsuelle2UniteLegale",
    "denominationUsuelle3UniteLegale",
    "categorieJuridiqueUniteLegale",
    "activitePrincipaleUniteLegale",
    "nomenclatureActivitePrincipaleUniteLegale",
    "nicSiegeUniteLegale",
    "economieSocialeSolidaireUniteLegale",
    "caractereEmployeurUniteLegale"
  ],
  settings: {
    // Ignore malformed errors globally
    // Docs https://www.elastic.co/guide/en/elasticsearch/reference/7.17/ignore-malformed.html#ignore-malformed-setting
   "index.mapping.ignore_malformed": true
  }
};


const multiGet = (
  body: ElasticBulkNonFlatPayload,
  sireneIndexConfig: IndexProcessConfig
) =>
  client.mget({
    index: sireneIndexConfig.alias,
    body: {
      ids: body.map(doc => doc[1].siren)
    }
  });

/**
 * Append SIREN data to SIRET data
 */
const siretWithUniteLegaleFormatter = async (
  body: ElasticBulkNonFlatPayload,
  extras: { sireneIndexConfig: IndexProcessConfig }
): Promise<ElasticBulkNonFlatPayload> => {
  if (!body.length) {
    return [];
  }
  const response = await multiGet(body, extras.sireneIndexConfig);
  if (!response.body.docs.length) {
    logger.error(`Empty SIRENE data returned from ${extras.sireneIndexConfig.alias}, final data may be corrupted`);
  }
  return response.body.docs.map((sirenDoc, i) => [
    body[i][0],
    {
      ...body[i][1],
      ...sirenDoc._source
    }
  ]);
};

/**
 * StockEtablissement configuration
 */
export const siretUrl =
  process.env.INSEE_SIRET_URL ||
  "https://files.data.gouv.fr/insee-sirene/StockEtablissement_utf8.zip";

export const siretIndexConfig: IndexProcessConfig = {
  alias: `${INDEX_NAME_INSEE_PREFIX}etablissement${INDEX_ALIAS_NAME_SEPARATOR}${
    process.env.NODE_ENV ? process.env.NODE_ENV : "dev"
  }${
    process.env.INDEX_ALIAS_NAME_SUFFIX
      ? process.env.INDEX_ALIAS_NAME_SUFFIX
      : ""
  }`,
  // to match the filename inside zip
  csvFileName: "StockEtablissement_utf8.csv",
  // zip target filename
  zipFileName: "StockEtablissement_utf8.zip",
  idKey: "siret",
  // append StockUniteLegale by JOINING ON siren
  dataFormatterFn: siretWithUniteLegaleFormatter,
  dataFormatterExtras: {
    sireneIndexConfig
  },
  // copy_to full-text search field to optimize multiple field search performance
  // docs https://www.elastic.co/guide/en/elasticsearch/reference/7.16/copy-to.html
  mappings: {
    _doc: {
      // inherit from standardMapping
      ...standardMapping._doc,
      // override
      properties: {
        siren: {
          type: "text",
          copy_to: "td_search_companies"
        },
        siret: {
          type: "text",
          copy_to: "td_search_companies"
        },
        denominationUniteLegale: {
          type: "text",
          copy_to: "td_search_companies"
        },
        nomUniteLegale: {
          type: "text",
          copy_to: "td_search_companies"
        },
        denominationUsuelleEtablissement: {
          type: "text",
          copy_to: "td_search_companies"
        },
        denominationUsuelle1UniteLegale: {
          type: "text",
          copy_to: "td_search_companies"
        },
        denominationUsuelle2UniteLegale: {
          type: "text",
          copy_to: "td_search_companies"
        },
        denominationUsuelle3UniteLegale: {
          type: "text",
          copy_to: "td_search_companies"
        },
        nomUsageUniteLegale: {
          type: "text",
          copy_to: "td_search_companies"
        },
        sigleUniteLegale: {
          type: "text",
          copy_to: "td_search_companies"
        },
        enseigne1Etablissement: {
          type: "text",
          copy_to: "td_search_companies"
        },
        enseigne2Etablissement: {
          type: "text",
          copy_to: "td_search_companies"
        },
        enseigne3Etablissement: {
          type: "text",
          copy_to: "td_search_companies"
        },
        td_search_companies: {
          type: "text"
        }
      }
    }
  },
  headers: [
    "siren",
    "nic",
    "siret",
    "statutDiffusionEtablissement",
    "dateCreationEtablissement",
    "trancheEffectifsEtablissement",
    "anneeEffectifsEtablissement",
    "activitePrincipaleRegistreMetiersEtablissement",
    "dateDernierTraitementEtablissement",
    "etablissementSiege",
    "nombrePeriodesEtablissement",
    "complementAdresseEtablissement",
    "numeroVoieEtablissement",
    "indiceRepetitionEtablissement",
    "typeVoieEtablissement",
    "libelleVoieEtablissement",
    "codePostalEtablissement",
    "libelleCommuneEtablissement",
    "libelleCommuneEtrangerEtablissement",
    "distributionSpecialeEtablissement",
    "codeCommuneEtablissement",
    "codeCedexEtablissement",
    "libelleCedexEtablissement",
    "codePaysEtrangerEtablissement",
    "libellePaysEtrangerEtablissement",
    "complementAdresse2Etablissement",
    "numeroVoie2Etablissement",
    "indiceRepetition2Etablissement",
    "typeVoie2Etablissement",
    "libelleVoie2Etablissement",
    "codePostal2Etablissement",
    "libelleCommune2Etablissement",
    "libelleCommuneEtranger2Etablissement",
    "distributionSpeciale2Etablissement",
    "codeCommune2Etablissement",
    "codeCedex2Etablissement",
    "libelleCedex2Etablissement",
    "codePaysEtranger2Etablissement",
    "libellePaysEtranger2Etablissement",
    "dateDebut",
    "etatAdministratifEtablissement",
    "enseigne1Etablissement",
    "enseigne2Etablissement",
    "enseigne3Etablissement",
    "denominationUsuelleEtablissement",
    "activitePrincipaleEtablissement",
    "nomenclatureActivitePrincipaleEtablissement",
    "caractereEmployeurEtablissement"
  ],
  settings: {
    "index.mapping.ignore_malformed": true,
    "index.number_of_replicas": process.env.TD_SIRENE_INDEX_NB_REPLICAS || "3"
  }
};
