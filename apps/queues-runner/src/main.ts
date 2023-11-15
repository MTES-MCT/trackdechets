import {
  sendMailJob,
  mailQueue,
  syncEventsQueue,
  geocodeCompanyQueue,
  setCompanyDepartementQueue,
  geocodeJob,
  setDepartementJob,
  syncEventsJob
} from "back";

import { schema } from "@td/env";

schema
  .pick({
    NODE_ENV: true,
    REDIS_URL: true,
    QUEUE_NAME_SENDMAIL: true,
    QUEUE_NAME_COMPANY: true
  })
  .parse(process.env);

function startConsumers() {
  console.info(`General queues consumers started`);

  mailQueue.process(sendMailJob);
  geocodeCompanyQueue.process(geocodeJob);
  setCompanyDepartementQueue.process(setDepartementJob);
  syncEventsQueue.process(syncEventsJob);
}

startConsumers();
