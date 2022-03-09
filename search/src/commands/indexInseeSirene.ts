import "../common/tracer"; // tracer.init() doit précéder l'importation des modules instrumentés.
import { logger } from "../common/logger";
import {
  downloadAndIndex,
  unzipAndIndex,
  sireneIndexConfig
} from "../indexation/elasticSearch.helpers";

/**
 * StockUniteLegale data specifications
 * infos : https://www.insee.fr/fr/statistiques/4202741?sommaire=3357459
 */
const sireneUrl =
  process.env.INSEE_SIRENE_URL ||
  "https://files.data.gouv.fr/insee-sirene/StockUniteLegale_utf8.zip";

process.on("exit", function () {
  console.log(`Command indexInseeSirene.ts finished`);
  logger.end();
});

/**
 * Index the Sirene INSEE database
 */
(async function main() {
  logger.info("Starting indexation of StockUniteLegale");
  if (process.env.INSEE_SIRENE_ZIP_PATH) {
    await unzipAndIndex(process.env.INSEE_SIRENE_ZIP_PATH, sireneIndexConfig);
  } else {
    await downloadAndIndex(sireneUrl, sireneIndexConfig);
  }
})();
