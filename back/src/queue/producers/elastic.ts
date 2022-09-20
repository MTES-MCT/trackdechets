// eslint-disable-next-line import/no-named-as-default
import Queue, { JobOptions } from "bull";
import logger from "../../logging/logger";
import { indexAllBsdJob } from "../jobs/indexAllBsds";

export type BsdUpdateQueueItem = { sirets: string[]; id: string };
const { REDIS_URL, NODE_ENV } = process.env;

export const indexQueue = new Queue<string>(
  `queue_index_elastic_${NODE_ENV}`,
  REDIS_URL,
  {
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 100 },
      removeOnComplete: 100,
      timeout: 10000
    }
  }
);

const INDEX_REFRESH_INTERVAL = 1000;
export const updatesQueue = new Queue<BsdUpdateQueueItem>(
  `queue_updates_elastic_${NODE_ENV}`,
  REDIS_URL,
  {
    defaultJobOptions: {
      delay: INDEX_REFRESH_INTERVAL, // We delay processing to make sure updates have been refreshed in ES
      removeOnComplete: 100
    }
  }
);

indexQueue.on("completed", job => {
  const id = job.data;
  const { sirets } = job.returnvalue;

  updatesQueue.add({ sirets, id });
});

indexQueue.on("failed", (job, err) => {
  const id = job.data;

  logger.error(`Indexation job failed for bsd "${id}"`, { id, err });
});

export async function enqueueBsdToIndex(
  bsdId: string,
  options?: JobOptions
): Promise<void> {
  logger.info(`Enquing BSD ${bsdId} for indexation`);
  await indexQueue.add("index", bsdId, options);
}

export async function enqueueBsdToDelete(
  bsdId: string,
  options?: JobOptions
): Promise<void> {
  await indexQueue.add("delete", bsdId, options);
}

export function closeIndexAndUpdatesQueue() {
  return Promise.all([indexQueue.close(), updatesQueue.close()]);
}

export async function enqueueAllBsdToIndex(
  options?: JobOptions
): Promise<void> {
  try {
    await indexQueue.add("indexAll", options);
  } catch (e) {
    logger.error(
      `Indexation indexAll job failed, retrying without job queue: ${e}`
    );
    await indexAllBsdJob();
  }
}
