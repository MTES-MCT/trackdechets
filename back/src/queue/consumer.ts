import { sendMailJob } from "./jobs";
import { mailQueue } from "./producers/mail";
import {
  geocodeCompanyQueue,
  setCompanyDepartementQueue
} from "./producers/company";
import { geocodeJob } from "./jobs/geocode";
import { setDepartementJob } from "./jobs/setDepartement";

function startConsumers() {
  console.info(`General queues consumers started`);

  mailQueue.process(sendMailJob);
  geocodeCompanyQueue.process(geocodeJob);
  setCompanyDepartementQueue.process(setDepartementJob);
}

startConsumers();
