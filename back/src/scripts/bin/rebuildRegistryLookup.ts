import {
  ssdLookupUtils,
  incomingWasteLookupUtils,
  incomingTexsLookupUtils
} from "@td/registry";
import { logger } from "@td/logger";
import { prisma } from "@td/prisma";
import { lookupUtils as bsvhuLookupUtils } from "../../bsvhu/registryV2";
import { lookupUtils as bspaohLookupUtils } from "../../bspaoh/registryV2";

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
    await ssdLookupUtils.rebuildLookup();
    await incomingWasteLookupUtils.rebuildLookup();
    await incomingTexsLookupUtils.rebuildLookup();
    await bsvhuLookupUtils.rebuildLookup();
    await bspaohLookupUtils.rebuildLookup();
  } catch (error) {
    logger.error("Error in rebuildRegistryLookup script, exiting", error);
    throw new Error(`Error in rebuildRegistryLookup script : ${error}`);
  } finally {
    await exitScript();
  }
})();
