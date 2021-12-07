import { mailQueue } from "./producer";
import sendMailJob from "./jobs/sendmail";

const { REDIS_URL, QUEUE_NAME_SENDMAIL } = process.env;

/**
 * Script for launching an independant process for jobs
 */
mailQueue.process(sendMailJob);

console.log(
  `Worker started listening to queue: ${QUEUE_NAME_SENDMAIL} on ${REDIS_URL}`
);
