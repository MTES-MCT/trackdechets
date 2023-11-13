import "@total-typescript/ts-reset";
import { sendMailJob } from "back/src/queue/jobs";
import { mailQueue } from "back/src/queue/producers/mail";
import { syncEventsQueue } from "back/src/queue/producers/events";
import {
  geocodeCompanyQueue,
  setCompanyDepartementQueue
} from "back/src/queue/producers/company";
import { geocodeJob } from "back/src/queue/jobs/geocode";
import { setDepartementJob } from "back/src/queue/jobs/setDepartement";
import { syncEventsJob } from "back/src/queue/jobs/syncEvents";
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
