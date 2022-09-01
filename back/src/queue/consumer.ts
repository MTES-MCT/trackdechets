import { sendMailJob, indexBsdJob } from "./jobs";
import { mailQueue } from "./producers/mail";
import { indexQueue } from "./producers/elastic";
import { deleteBsdJob } from "./jobs/deleteBsd";

function startConsumers() {
  console.info(`Queues processors started`);

  mailQueue.process(sendMailJob);
  indexQueue.process("index", indexBsdJob);
  indexQueue.process("delete", deleteBsdJob);
}

startConsumers();
