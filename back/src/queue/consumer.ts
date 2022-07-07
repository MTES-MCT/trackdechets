import { sendMailJob, indexBsdJob } from "./jobs";
import { mailQueue } from "./producers/mail";
import { indexQueue } from "./producers/elastic";

const { REDIS_URL, QUEUE_NAME_SENDMAIL } = process.env;

function startConsumers() {
  console.info(
    `Queue process worker started listening to queue: ${QUEUE_NAME_SENDMAIL} on ${REDIS_URL}`
  );

  mailQueue.process(sendMailJob);
  indexQueue.process(indexBsdJob);
}

startConsumers();
