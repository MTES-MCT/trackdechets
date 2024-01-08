import { prisma } from "@td/prisma";
import { closeQueues } from "../../queue/producers";
import { logger } from "@td/logger";
import { processDbIdentifiersByChunk } from "../../bsds/indexation/bulkIndexBsds";
import { updateFavorites } from "../../companies/database";

/**
 * Reindex al favorites using the async job
 */
async function exitScript() {
  logger.info("Done adding indexFavorites job the job queue, exiting");
  await prisma.$disconnect();
  await closeQueues();
  process.exit(0);
}

(async function () {
  const companies = await prisma.company.findMany({
    select: { orgId: true }
  });

  const orgIds = companies.map(bsd => bsd.orgId);
  logger.info(
    `Starting indexation of favorites for ${orgIds.length} Companies`
  );
  await processDbIdentifiersByChunk(orgIds, async chunk => {
    await updateFavorites(chunk);
  });
  return exitScript();
})();
