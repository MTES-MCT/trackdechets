import Queue from "bull";

const { REDIS_URL, NODE_ENV } = process.env;

export type BsdUpdateQueueItem = {
  sirets: string[];
  id: string;
  jobName?: string;
};

const INDEX_REFRESH_INTERVAL = 1000;

// Updates queue, used by the notifier. Items are enqueued once indexation is done
export const updatesQueue = new Queue<BsdUpdateQueueItem>(
  `queue_updates_elastic_${NODE_ENV}`,
  REDIS_URL!,
  {
    defaultJobOptions: {
      delay: INDEX_REFRESH_INTERVAL, // We delay processing to make sure updates have been refreshed in ES
      removeOnComplete: 100
    }
  }
);
