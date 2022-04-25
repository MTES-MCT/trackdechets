import "../common/tracer"; // tracer.init() doit précéder l'importation des modules instrumentés.
import path from "path";
import fs from "fs";
import { logger } from "../common/logger";
import {
  downloadAndIndex,
  unzipAndIndex
} from "../indexation/elasticSearch.helpers";

import { sireneIndexConfig  } from "../indexation/indexInsee.helpers";

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
    // path ../../csv* is in .gitignore or override with INSEE_DOWNLOAD_DIRECTORY
    const destination = fs.mkdtempSync(
      process.env.INSEE_DOWNLOAD_DIRECTORY ||
        path.join(__dirname, "..", "..", "csv")
    );
    await unzipAndIndex(
      process.env.INSEE_SIRENE_ZIP_PATH,
      destination,
      sireneIndexConfig
    );
  } else {
    await downloadAndIndex(sireneUrl, sireneIndexConfig);
  }
})();
