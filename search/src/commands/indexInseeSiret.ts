import "../common/tracer"; // tracer.init() doit précéder l'importation des modules instrumentés.
import { logger } from "..";
import { elasticSearchClient as client } from "..";
import {
  ElasticBulkNonFlatPayload,
  IndexProcessConfig
} from "../indexation/types";
import {
  downloadAndIndex,
  INDEX_ALIAS_NAME_SEPARATOR,
  standardMapping,
  streamCsvAndIndex,
  unzipAndIndex
} from "../indexation/elasticSearch.helpers";

process.on("exit", function () {
  console.log("Command indexInseeSirene.ts finished");
  logger.end();
});

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
const siretUrl =
  process.env.INSEE_SIRET_URL ||
  "https://files.data.gouv.fr/insee-sirene/StockEtablissement_utf8.zip";

const siretIndexConfig: IndexProcessConfig = {
  alias: `stocketablissement${INDEX_ALIAS_NAME_SEPARATOR}${
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
  }
};

/**
 * Index the SIRET INSEE database
 */
(async function main() {
  logger.info("Starting indexation of StockEtablissements");
  if (process.env.INSEE_SIRET_ZIP_PATH) {
    await unzipAndIndex(process.env.INSEE_SIRET_ZIP_PATH, siretIndexConfig);
  } else if (process.env.INSEE_SIRET_CSV_PATH) {
    await streamCsvAndIndex(process.env.INSEE_SIRET_CSV_PATH, siretIndexConfig);
  } else {
    await downloadAndIndex(siretUrl, siretIndexConfig);
  }
  logger.info("Command indexInseeSiret.ts finished");
})();
