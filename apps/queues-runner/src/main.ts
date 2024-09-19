import {
  sendMailJob,
  mailQueue,
  syncEventsQueue,
  geocodeCompanyQueue,
  setCompanyDepartementQueue,
  geocodeJob,
  setDepartementJob,
  syncEventsJob,
  operationHooksQueue,
  operationHookJob,
  administrativeTransferQueue,
  processAdministrativeTransferJob,
  updateAppendix2Queue,
  updateAppendix2Job,
  registryImportQueue,
  processRegistryImportJob
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
  operationHooksQueue.process(operationHookJob);
  administrativeTransferQueue.process(processAdministrativeTransferJob);
  updateAppendix2Queue.process(updateAppendix2Job);
  registryImportQueue.process(processRegistryImportJob);
}

startConsumers();
