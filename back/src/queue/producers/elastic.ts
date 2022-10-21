// eslint-disable-next-line import/no-named-as-default
import Queue, { JobOptions } from "bull";
import logger from "../../logging/logger";

export type BsdUpdateQueueItem = { sirets: string[]; id: string };
const { REDIS_URL, NODE_ENV } = process.env;

export const INDEX_JOB_NAME = "index";
export const DELETE_JOB_NAME = "delete";

const INDEX_QUEUE_NAME = `queue_index_elastic_${NODE_ENV}`;

export const indexQueue = new Queue<string>(INDEX_QUEUE_NAME, REDIS_URL, {
  prefix: `{${INDEX_QUEUE_NAME}}`,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "fixed", delay: 100 },
    removeOnComplete: 10_000,
    timeout: 10000
  }
});

const INDEX_REFRESH_INTERVAL = 1000;
const updatesQueueName = `queue_updates_elastic_${NODE_ENV}`;
export const updatesQueue = new Queue<BsdUpdateQueueItem>(
  updatesQueueName,
  REDIS_URL,
  {
    prefix: `{${updatesQueueName}}`,
    defaultJobOptions: {
      delay: INDEX_REFRESH_INTERVAL, // We delay processing to make sure updates have been refreshed in ES
      removeOnComplete: 100
    }
  }
);

indexQueue.on("completed", job => {
  const id = job.data;
  const { sirets } = job.returnvalue;
  if ([DELETE_JOB_NAME, INDEX_JOB_NAME].includes(job.name)) {
    updatesQueue.add({ sirets, id });
  }
});

indexQueue.on("failed", (job, err) => {
  const id = job.data;

  logger.error(`Indexation job failed for bsd "${id}"`, { id, err });
});

export async function enqueueBsdToIndex(
  bsdId: string,
  options?: JobOptions
): Promise<void> {
  logger.info(`Enqueuing BSD ${bsdId} for indexation`);
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
