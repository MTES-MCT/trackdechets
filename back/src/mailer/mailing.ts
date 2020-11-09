 
import { Mail, Contact } from "./types";
import consoleBackend from "./consoleBackend";
import mailjetBackend from "./mailjetBackend";

const backend = mailjetBackend;

export default function sendMail(mail: Mail) {
 
  backend.sendMail(mail);
}

export function addContact(contact: Contact) {
  backend.addContact(contact);
}
