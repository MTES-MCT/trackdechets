import Queue from "bull";
import { SEND_GERICO_API_REQUEST_JOB_NAME } from "./jobNames";

const { REDIS_URL, NODE_ENV } = process.env;

export type GericoQueueItem = {
  companyDigestId: string;

  jobName?: string;
};

const GERICHO_QUEUE_NAME = `queue_gerico_${NODE_ENV}`;

export const gericoQueue = new Queue<GericoQueueItem>(
  GERICHO_QUEUE_NAME,
  REDIS_URL!,
  {
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "fixed", delay: 1000 },
      removeOnComplete: 100
    }
  }
);

export const sendGericoApiRequest = (companyDigestId: string) => {
  gericoQueue.add(SEND_GERICO_API_REQUEST_JOB_NAME, {
    companyDigestId
  });
};

export const closeGericoQueue = () => gericoQueue.close();
