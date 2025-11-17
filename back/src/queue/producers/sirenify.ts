import { logger } from "@td/logger";
import Queue, { JobOptions } from "bull";
import { SIRENIFY_JOB_NAME } from "./jobNames";
const { REDIS_URL, NODE_ENV } = process.env;

export const SIRENIFY_QUEUE_NAME = `queue_bulk_sirenify_${NODE_ENV}`;

export const sirenifyQueue = new Queue<string>(
  SIRENIFY_QUEUE_NAME,
  REDIS_URL!,
  {
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: "fixed", delay: 100 },
      stackTraceLimit: 100,
      removeOnComplete: 1000,
      removeOnFail: 5000,
      // 30 secondes
      timeout: 30 * 1000
    }
  }
);

export async function enqueueSirenifyJob(
  bsdId: string,
  options?: JobOptions
): Promise<void> {
  logger.info(`Enqueuing BSD ${bsdId} for sirenification`);
  await sirenifyQueue.add(SIRENIFY_JOB_NAME, bsdId, options);
}

export const closeSirenifyQueue = () => sirenifyQueue.close();
