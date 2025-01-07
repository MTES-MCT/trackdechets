import { LookupUtils } from "@td/registry";
import { logger } from "@td/logger";
import { prisma } from "@td/prisma";

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
    await LookupUtils.RegistrySsd.rebuildLookup();
  } catch (error) {
    logger.error("Error in rebuildRegistryLookup script, exiting", error);
    throw new Error(`Error in rebuildRegistryLookup script : ${error}`);
  } finally {
    await exitScript();
  }
})();
