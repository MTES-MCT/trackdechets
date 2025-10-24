import { Bsvhu, BsvhuStatus } from "@td/prisma";
import { prisma } from "@td/prisma";
import { logger } from "@td/logger";
import Queue, { JobOptions } from "bull";
import { searchCompanyFailFast } from "back/src/companies/sirenify";

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

export async function run() {
  logger.info("starting BSVHU emitter not on TD script");
  let finished = false;
  let lastId: string | null = null;

  while (!finished) {
    let bsvhus: Bsvhu[] = [];
    try {
      bsvhus = await prisma.bsvhu.findMany({
        take: 10,
        ...(lastId
          ? {
              cursor: {
                id: lastId
              },
              skip: 1 // Skip the cursor
            }
          : {}),
        where: {
          AND: [
            {
              isDraft: false
            },
            {
              emitterIrregularSituation: true
            },
            {
              status: BsvhuStatus.INITIAL
            },
            {
              NOT: {
                isDeleted: true
              }
            },
            {
              NOT: {
                emitterNoSiret: true
              }
            }
          ]
        },
        orderBy: {
          id: "asc"
        }
      });
    } catch (error) {
      logger.error(`failed to fetch bsvhus from cursor ${lastId}`);
      logger.error(error);
      break;
    }
    logger.info(`got BSVHUs ${bsvhus.map(bsvhu => bsvhu.id).join(", ")}`);
    if (bsvhus.length < 10) {
      finished = true;
    }
    if (bsvhus.length === 0) {
      break;
    }
    lastId = bsvhus[bsvhus.length - 1].id;
    for (const bsvhu of bsvhus) {
      logger.info(`handling ${bsvhu.id}`);
      if (bsvhu.emitterCompanySiret) {
        const emitterCompany = await searchCompanyFailFast(
          bsvhu.emitterCompanySiret
        );
        if (!emitterCompany) {
          logger.info(`updating ${bsvhu.id}`);
          await prisma.bsvhu.update({
            where: { id: bsvhu.id },
            data: {
              emitterNotOnTD: true
            },
            select: {
              id: true
            }
          });
          enqueueUpdatedBsdToIndex(bsvhu.id);
        }
        logger.info(`handled ${bsvhu.id}`);
      }
    }
  }
}
