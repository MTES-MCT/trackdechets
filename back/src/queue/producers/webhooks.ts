// eslint-disable-next-line import/no-named-as-default
import Queue from "bull";

import {
  INDEX_CREATED_JOB_NAME,
  INDEX_UPDATED_JOB_NAME,
  DELETE_JOB_NAME
} from "./jobNames";
import { getReadOnlyFormRepository } from "../../forms/repository";
import { toBsdElastic } from "../../forms/elastic";
const { REDIS_URL, NODE_ENV } = process.env;

export type WebhookQueueItem = {
  sirets: string[];
  id: string;
  action: string;
  jobName?: string;
};

export const SEND_WEBHOOK_JOB_NAME = "SEND_WEBHOOK";
const WEBHOOKS_QUEUE_NAME = `queue_webhooks_${NODE_ENV}`;

export const webhooksQueue = new Queue<WebhookQueueItem>(
  WEBHOOKS_QUEUE_NAME,
  REDIS_URL!,
  {
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "fixed", delay: 1000 },
      removeOnComplete: 100
    }
  }
);

const jobNames = [
  DELETE_JOB_NAME,
  INDEX_CREATED_JOB_NAME,
  INDEX_UPDATED_JOB_NAME
];

export const enqueueDeletedFormWebhook = async (id: string) => {
  const fullForm = await getReadOnlyFormRepository().findFullFormById(id);
  if (!fullForm) return;
  const bsdElastic = toBsdElastic(fullForm);
  const { sirets } = bsdElastic;
  return scheduleWebhook(fullForm.readableId, sirets, DELETE_JOB_NAME);
};

export const scheduleWebhook = (
  id: string,
  sirets: string[],
  jobName: string
) => {
  if (!jobNames.includes(jobName)) {
    return;
  }
  const jobNameToAction = {
    [DELETE_JOB_NAME]: "DELETED",
    [INDEX_CREATED_JOB_NAME]: "CREATED",
    [INDEX_UPDATED_JOB_NAME]: "UPDATED"
  };

  webhooksQueue.add(SEND_WEBHOOK_JOB_NAME, {
    id,
    sirets: Array.from(sirets),
    action: jobNameToAction[jobName]
  });
};
export const closeWebhooksQueue = () => webhooksQueue.close();
