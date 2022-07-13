// eslint-disable-next-line import/no-named-as-default
import Queue, { JobOptions } from "bull";
import { BsdElastic } from "../../common/elastic";

export type BsdUpdateQueueItem = { sirets: string[]; id: string };
const { REDIS_URL, NODE_ENV } = process.env;

export const indexQueue = new Queue<BsdElastic>(
  `queue_index_elastic_${NODE_ENV}`,
  REDIS_URL,
  {
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 100 },
      removeOnComplete: true,
      timeout: 10000
    }
  }
);

export const updatesQueue = new Queue<BsdUpdateQueueItem>(
  `queue_updates_elastic_${NODE_ENV}`,
  REDIS_URL
);

indexQueue.on("completed", job => {
  const { sirets, id } = job.data;

  updatesQueue.add({ sirets, id });
});

export async function addToIndexQueue(
  jobData: BsdElastic,
  options?: JobOptions
): Promise<void> {
  await indexQueue.add(jobData, options);
}

export function closeIndexAndUpdatesQueue() {
  return Promise.all([indexQueue.close(), updatesQueue.close()]);
}
