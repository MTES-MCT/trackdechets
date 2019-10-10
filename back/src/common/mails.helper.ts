import axios from "axios";
const { MJ_MAIN_TEMPLATE_ID } = process.env;

type Attachment = {
  name: string;
  file: string;
};
type Mail = {
  toEmail: string;
  toName: string;
  subject: string;
  title: string;
  body: string;
  templateId?: number;
  attachment?: Attachment;
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
