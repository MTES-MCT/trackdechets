import { sendMailJob, indexBsdJob } from "./jobs";
import { mailQueue } from "./producers/mail";
import { indexQueue } from "./producers/elastic";

function startConsumers() {
  console.info(`Queues processors started`);

  mailQueue.process(sendMailJob);
  indexQueue.process(indexBsdJob);
}

startConsumers();
