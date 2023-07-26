// eslint-disable-next-line import/no-named-as-default
import Queue, { JobOptions } from "bull";
import logger from "../../logging/logger";
import { scheduleWebhook } from "./webhooks";
import {
  INDEX_JOB_NAME,
  INDEX_CREATED_JOB_NAME,
  INDEX_UPDATED_JOB_NAME,
  DELETE_JOB_NAME
} from "./jobNames";
import { updatesQueue } from "./bsdUpdate";

const { REDIS_URL, NODE_ENV } = process.env;
export const INDEX_QUEUE_NAME = `queue_index_elastic_${NODE_ENV}`;

export const indexQueue = new Queue<string>(INDEX_QUEUE_NAME, REDIS_URL!, {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "fixed", delay: 100 },
    removeOnComplete: 10_000,
    timeout: 10000
  }
});

indexQueue.on("completed", job => {
  const id = job.data;

  const { sirets, siretsBeforeUpdate } = job.returnvalue;

  if (
    [
      DELETE_JOB_NAME,
      INDEX_JOB_NAME,
      INDEX_CREATED_JOB_NAME,
      INDEX_UPDATED_JOB_NAME
    ].includes(job.name)
  ) {
    // aggregate and deduplicate sirets to notify relevant recipients
    const siretsToNotify = Array.from(
      new Set([...sirets, ...(siretsBeforeUpdate ?? [])])
    );

    updatesQueue.add({ sirets: siretsToNotify, id, jobName: job.name });
    scheduleWebhook(id, siretsToNotify, job.name);
  }
});

indexQueue.on("failed", (job, err) => {
  const id = job.data;
  logger.error(`Indexation job failed for bsd "${id}"`, { id, err });
});

type JobName = typeof INDEX_CREATED_JOB_NAME | typeof INDEX_UPDATED_JOB_NAME;

async function enqueueBsdToIndex(
  bsdId: string,
  jobName: JobName,
  options?: JobOptions
): Promise<void> {
  logger.info(`Enqueuing BSD ${bsdId} for indexation`);
  await indexQueue.add(jobName, bsdId, options);
}

export async function enqueueCreatedBsdToIndex(
  bsdId: string,
  options?: JobOptions
): Promise<void> {
  await enqueueBsdToIndex(bsdId, INDEX_CREATED_JOB_NAME, options);
}

export async function enqueueUpdatedBsdToIndex(
  bsdId: string,
  options?: JobOptions
): Promise<void> {
  await enqueueBsdToIndex(bsdId, INDEX_UPDATED_JOB_NAME, options);
}

export async function enqueueBsdToDelete(
  bsdId: string,
  options?: JobOptions
): Promise<void> {
  await indexQueue.add(DELETE_JOB_NAME, bsdId, options);
}

export function closeIndexAndUpdatesQueue() {
  return Promise.all([indexQueue.close(), updatesQueue.close()]);
}
