import {
  ssdLookupUtils,
  incomingWasteLookupUtils,
  incomingTexsLookupUtils
} from "@td/registry";
import { logger } from "@td/logger";
import { prisma } from "@td/prisma";
import { lookupUtils as bsddLookupUtils } from "../../forms/registryV2";
import { lookupUtils as bsdaLookupUtils } from "../../bsda/registryV2";
import { lookupUtils as bsdasriLookupUtils } from "../../bsdasris/registryV2";
import { lookupUtils as bsffLookupUtils } from "../../bsffs/registryV2";
import { lookupUtils as bspaohLookupUtils } from "../../bspaoh/registryV2";
import { lookupUtils as bsvhuLookupUtils } from "../../bsvhu/registryV2";

async function exitScript() {
  logger.info("Done rebuildRegistryLookup script, exiting");
  await prisma.$disconnect();
  process.exit(0);
}
/**
 * Reindex all BSD with ou without the async job queue (--useQueue)
 */
(async function () {
  try {
    logger.info("Rebuilding SSD registry lookup");
    await ssdLookupUtils.rebuildLookup();
    logger.info("Rebuilding incoming waste registry lookup");
    await incomingWasteLookupUtils.rebuildLookup();
    logger.info("Rebuilding incoming texs registry lookup");
    await incomingTexsLookupUtils.rebuildLookup();
    logger.info("Rebuilding BSDD lookup");
    await bsddLookupUtils.rebuildLookup();
    logger.info("Rebuilding BSDA lookup");
    await bsdaLookupUtils.rebuildLookup();
    logger.info("Rebuilding BSDASRI lookup");
    await bsdasriLookupUtils.rebuildLookup();
    logger.info("Rebuilding BSFF lookup");
    await bsffLookupUtils.rebuildLookup();
    logger.info("Rebuilding BSPAOH lookup");
    await bspaohLookupUtils.rebuildLookup();
    logger.info("Rebuilding BSVHU lookup");
    await bsvhuLookupUtils.rebuildLookup();
  } catch (error) {
    logger.error("Error in rebuildRegistryLookup script, exiting", error);
    throw new Error(`Error in rebuildRegistryLookup script : ${error}`);
  } finally {
    await exitScript();
  }
})();
