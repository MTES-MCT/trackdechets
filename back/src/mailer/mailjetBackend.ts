import { Mail, Contact } from "./types";
import mailjet from "node-mailjet";

const mj = mailjet.connect(
  process.env.MJ_APIKEY_PUBLIC,
  process.env.MJ_APIKEY_PRIVATE
);
const MJ_MAIN_TEMPLATE_ID = process.env.MJ_MAIN_TEMPLATE_ID;
const mailjetBackend = {
  backendName: "Mailjet",

  sendMail: function(mail: Mail) {
    if (!mail.templateId) {
      mail.templateId = parseInt(MJ_MAIN_TEMPLATE_ID, 10);
    }

    let payload = {
      From: {
        Email: process.env.MJ_SENDER_EMAIL_ADDRESS,
        Name: process.env.MJ_SENDER_NAME
      },
      To: mail.to,
      TemplateId: mail.templateId,
      TemplateLanguage: true,
      Variables: {
        ...mail.vars,
        subject: mail.subject,
        title: mail.title,
        body: mail.body,
        baseurl: mail.baseUrl
      },
      Subject: mail.subject
    };
    if (!!mail.attachment?.file) {
      payload["Attachments"] = [
        {
          ContentType: "application/pdf",
          Filename: mail.attachment.name,
          Base64Content: mail.attachment.file
        }
      ];
    }

    const request = mj
      .post("send", { version: "v3.1" })
      .request({ Messages: [payload] });
    request
      .then(result => {
        console.log(result.body);
      })
      .catch(err => {
        console.log(err.statusCode);
      });
  },
  addContact: function(contact: Contact) {
    const request = mj
      .post("contact", { version: "v3" })
      .request({ Name: contact.name, Email: contact.email });
    request
      .then(result => {
        console.log(result.body);
      })
      .catch(err => {
        console.log(err.statusCode);
      });
  }
};

export default mailjetBackend;
