import axios from "axios";
const { MJ_MAIN_TEMPLATE_ID } = process.env;

type Attachment = {
  name: string;
  file: string;
};
type Recipient = {
  name: string;
  email: string;
};
type Mail = {
  to: Recipient[];
  cc?: Recipient[];
  subject: string;
  title: string;
  body: string;
  templateId?: number;
  attachment?: Attachment;
  vars?: { [id: string]: any };
};

export function sendMail(mail: Mail) {
  if (!mail.templateId) {
    mail.templateId = parseInt(MJ_MAIN_TEMPLATE_ID, 10);
  }
  return axios
    .post("http://td-mail/send", mail)
    .catch(err =>
      console.error("Error while pushing mail to mail service", err)
    );
}

export function addContact({ email, name }: { email: string; name: string }) {
  return axios
    .post("http://td-mail/contact", { email, name })
    .catch(err =>
      console.error("Error while pushing new contact to mail service", err)
    );
}

const unwantedChars = /\*|\//g;
/**
 * Remove * and / special chars appearing on some individual companies
 * @param name string
 */
export const cleanupSpecialChars = (name: string): string => {
  if (!name) {
    return "";
  }
  return name.replace(unwantedChars, " ").trim();
};

const frMonth = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre"
];
/**
 * Format a date as fr verbose format
 * @param someDate Date
 */
export const toFrFormat = (someDate: Date): string =>
  `${someDate.getDate()} ${
    frMonth[someDate.getMonth()]
  } ${someDate.getFullYear()}`;
