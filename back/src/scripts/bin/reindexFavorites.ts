import prisma from "../../prisma";
import { closeQueues } from "../../queue/producers";
import logger from "../../logging/logger";
import { allFavoriteTypes } from "../../companies/types";
import { favoritesCompanyQueue } from "../../queue/producers/company";
import { processDbIdentifiersByChunk } from "../../bsds/indexation/bulkIndexBsds";

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
    for (const favoriteType of allFavoriteTypes) {
      await favoritesCompanyQueue.addBulk(
        chunk.map(orgId => ({
          data: {
            orgId,
            type: favoriteType
          }
        }))
      );
    }
  });
  return exitScript();
})();