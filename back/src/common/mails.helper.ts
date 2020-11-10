 
const { EMAIL_BACKEND } = process.env;
import sendMailx, { addContact as addContactx } from "../mailer/mailing";

const getPrefix = () => {
  if (EMAIL_BACKEND === "mailjet") {
    return "MJ";
  }
  if (EMAIL_BACKEND === "sendinblue") {
    return "SIB";
  }
  return "";
};

const PREFIX = getPrefix();

export const templateIds = {
  MAIN_TEMPLATE_ID: process.env[`${PREFIX}_MAIN_TEMPLATE_ID`] || "1000", // console fake tpl ids
  FIRST_ONBOARDING_TEMPLATE_ID:
    process.env[`${PREFIX}_FIRST_ONBOARDING_TEMPLATE_ID`] || "2000",
  SECOND_ONBOARDING_TEMPLATE_ID:
    process.env[`${PREFIX}_SECOND_ONBOARDING_TEMPLATE_ID`] || "3000",
  SECURITY_CODE_RENEWAL_TEMPLATE_ID:
    process.env[`${PREFIX}_SECURITY_CODE_RENEWAL_TEMPLATE_ID`] || "4000"
};

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
    mail.templateId = parseInt(templateIds.MAIN_TEMPLATE_ID, 10);
  }
  return sendMailx(mail);
}

export function addContact({ email, name }: { email: string; name: string }) {
  return addContactx({ email, name });
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
