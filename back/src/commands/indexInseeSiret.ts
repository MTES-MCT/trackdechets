import { client } from "../common/elastic";
import { initSentry } from "../common/sentry";
import logger from "../logging/logger";
import { ElasticBulkNonFlatPayload, IndexProcessConfig } from "./types";
import {
  downloadAndIndex,
  standardMapping,
  unzipAndIndex
} from "./elasticSearch.helpers";

const Sentry = initSentry();

process.on("exit", function () {
  console.log(`Command indexInseeSirene.ts finished`);
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
  alias: `stocketablissement_utf8-${process.env.NODE_ENV}`,
  // to match the filename inside zip
  csvFileName: "StockEtablissement_utf8.csv",
  // zip target filename
  zipFileName: "StockEtablissement_utf8.zip",
  idKey: "siren",
  // append StockUniteLegale by JOINING ON "siren"
  dataFormatterFn: siretWithUniteLegaleFormatter,
  mappings: standardMapping
};

/**
 * Index the SIRET INSEE database
 */
(async function main() {
  logger.info("Starting indexation of StockEtablissements");
  try {
    if (process.env.INSEE_SIRET_ZIP_PATH) {
      await unzipAndIndex(process.env.INSEE_SIRET_ZIP_PATH, siretIndexConfig);
    } else {
      await downloadAndIndex(siretUrl, siretIndexConfig);
    }
    logger.info(`Command indexInseeSiret.ts finished`);
  } catch (exc) {
    Sentry.captureException(exc);
  }
})();
