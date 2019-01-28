import axios from "axios";

type Mail = {
  toEmail: string;
  toName: string;
  subject: string;
  title: string;
  body: string;
};

export function sendMail(mail: Mail) {
  return axios
    .post("http://td-mail/send", mail)
    .catch(err =>
      console.error("Error while pushing mail to mail service", err)
    );
}
