import axios from "axios";

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
  attachment?: Attachment;
};

export function sendMail(mail: Mail) {
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
