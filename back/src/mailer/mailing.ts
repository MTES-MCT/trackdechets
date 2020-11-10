import { Mail, Contact } from "./types";
import consoleBackend from "./consoleBackend";
import mailjetBackend from "./mailjetBackend";
import sendInBlueBackend from "./sendInBlueBackend";
const backends = {
  console: consoleBackend,
  mailjet: mailjetBackend,
  sendinblue: sendInBlueBackend
};
const backend = backends[process.env.EMAIL_BACKEND];

if (!backend) {
  throw new Error("Invalid email backend configuration: EMAIL_BACKEND");
}

export default function sendMail(mail: Mail) {
  backend.sendMail(mail);
}

export function addContact(contact: Contact) {
  backend.addContact(contact);
}
