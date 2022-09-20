import { sendMailJob, indexBsdJob } from "./jobs";
import { mailQueue } from "./producers/mail";
import { indexQueue } from "./producers/elastic";
import { deleteBsdJob } from "./jobs/deleteBsd";
import {
  geocodeCompanyQueue,
  setCompanyDepartementQueue
} from "./producers/company";
import { geocodeJob } from "./jobs/geocode";
import { setDepartementJob } from "./jobs/setDepartement";

function startConsumers() {
  console.info(`Queues processors started`);

  mailQueue.process(sendMailJob);
  indexQueue.process("index", indexBsdJob);
  indexQueue.process("delete", deleteBsdJob);
  geocodeCompanyQueue.process(geocodeJob);
  setCompanyDepartementQueue.process(setDepartementJob);
}

startConsumers();
