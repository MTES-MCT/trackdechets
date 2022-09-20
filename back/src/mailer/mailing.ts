import { Mail, Contact } from "./types";
import { backend } from ".";
import { addToMailQueue } from "../queue/producers/mail";

// push job to the job queue for the api server not to execute the sendMail itself
export async function sendMail(mail: Mail): Promise<void> {
  try {
    await addToMailQueue(mail);
  } catch (err) {
    console.error(`Error adding sendmail Job to the queue`, err);
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
