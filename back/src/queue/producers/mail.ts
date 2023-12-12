import Queue, { JobOptions } from "bull";
import { Mail } from "@td/mail";

const { REDIS_URL, QUEUE_NAME_SENDMAIL } = process.env;

/**
 * Connect to mailQueue once for the server
 */
export const mailQueue = new Queue(`${QUEUE_NAME_SENDMAIL}`, `${REDIS_URL}`, {
  defaultJobOptions: {
    removeOnComplete: 10_000
  },
  // Bull docs: https://docs.bullmq.io/guide/rate-limiting
  // Sendinblue rate limiting docs: https://developers.sendinblue.com/docs/api-limits#general-rate-limiting
  ...(process.env.JEST_WORKER_ID === undefined && {
    limiter: {
      max: parseInt(process.env.QUEUE_MAXRATE_SENDMAIL, 10) || 16,
      duration: 1000
    }
  })
});

/**
 * Utility function to add a sendMailJob to the queue
 * To process it on the other side of the queue,
 * you must create a job queue worker in your code
 * or use the default script ./consumer.ts
 */
export const addToMailQueue = async (
  jobData: Mail,
  options?: JobOptions
): Promise<void> => {
  // default options can be overwritten by the calling function
  const jobOptions: JobOptions = {
    attempts: 3,
    // Retry failing jobs: https://docs.bullmq.io/guide/retrying-failing-jobs
    backoff: { type: "exponential", delay: 100 },
    timeout: 10000,
    ...options
  };
  await mailQueue.add(jobData, jobOptions);
};

/**
 * Close gracefully the queue
 */
export const closeMailQueue = () => mailQueue.close();
