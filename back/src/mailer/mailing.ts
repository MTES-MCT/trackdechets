import { Mail, Contact } from "./types";
import consoleBackend from "./consoleBackend";
import mailjetBackend from "./mailjetBackend";
import sendInBlueBackend from "./sendInBlueBackend";
import { templateIds } from "./helpers";

const backends = {
  console: consoleBackend,
  mailjet: mailjetBackend,
  sendinblue: sendInBlueBackend
};
const backend = backends[process.env.EMAIL_BACKEND];

if (!backend) {
  throw new Error("Invalid email backend configuration: EMAIL_BACKEND");
}

export function sendMail(mail: Mail) {
  if (!mail.templateId) {
    mail.templateId = parseInt(templateIds.MAIN_TEMPLATE_ID, 10);
  }
  return backend.sendMail(mail);
}

export function addContact(contact: Contact) {
  return backend.addContact(contact);
}
