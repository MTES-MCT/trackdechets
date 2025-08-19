import { logger } from "@td/logger";
import { prisma } from "@td/prisma";
import Queue, { JobOptions } from "bull";

const { REDIS_URL, NODE_ENV } = process.env;
const INDEX_QUEUE_NAME = `queue_index_elastic_${NODE_ENV}`;

const indexQueue = new Queue<string>(INDEX_QUEUE_NAME, REDIS_URL!, {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "fixed", delay: 100 },
    removeOnComplete: 10_000,
    timeout: 10000
  }
});

async function enqueueUpdatedBsdToIndex(
  bsdId: string,
  options?: JobOptions
): Promise<void> {
  logger.info(`Enqueuing BSD ${bsdId} for indexation`);
  await indexQueue.add("index_updated", bsdId, options);
}

const SIRET_COREPILE = "42248908800068";
const SIRET_ECOSYSTEM = "83033936200022";
const NAME_ECOSYSTEM = "ECOSYSTEM";

export class UpdateEcorganisme {
  async run() {
    const bsds = await prisma.form.findMany({
      where: {
        ecoOrganismeSiret: SIRET_COREPILE,
        status: "SEALED",
        isDeleted: false
      },
      select: { readableId: true, id: true }
    });
    for (const bsd of bsds) {
      // no need to update denormalized fields

      logger.info(`Processing ${bsd.readableId}`);

      await prisma.form.update({
        where: { id: bsd.id },
        data: {
          ecoOrganismeSiret: SIRET_ECOSYSTEM,
          ecoOrganismeName: NAME_ECOSYSTEM
        }
      });
      // ~ 370 bordereaux en prod
      await enqueueUpdatedBsdToIndex(bsd.readableId);
    }

    logger.info(`${bsds.length} processed bsdds`);
  }
}

export async function run() {
  await new UpdateEcorganisme().run();
}
