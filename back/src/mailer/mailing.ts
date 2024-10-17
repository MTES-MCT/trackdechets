import { backend, Mail, Contact } from "@td/mail";
import { addToMailQueue } from "../queue/producers/mail";
import { logger } from "@td/logger";

type SendMailOpts = {
  sync: boolean;
};

// push job to the job queue for the api server not to execute the sendMail itself
export async function sendMail(mail: Mail, opts?: SendMailOpts): Promise<void> {
  if (opts?.sync) {
    await sendMailSync(mail);
    return;
  }
  try {
    await addToMailQueue(mail);
  } catch (err) {
    logger.error(`Error adding sendmail Job to the queue`, err);
    await sendMailSync(mail);
  }
}

// by-pass the job queue for a cron task execution for example
export function sendMailSync(mail: Mail) {
  return backend.sendMail(mail);
}

export function addContact(contact: Contact) {
  return backend.addContact(contact);
}
