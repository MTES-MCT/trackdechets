import { Mail, Contact } from "../types";
import axios from "axios";
import * as Sentry from "@sentry/node";

const {
  SIB_APIKEY,
  SENDER_EMAIL_ADDRESS,
  SENDER_NAME,
  SENTRY_DSN,
  SIB_BASE_URL
} = process.env;

const SIB_SMTP_URL = `${SIB_BASE_URL}/smtp/email`;
const SIB_CONTACT_URL = `${SIB_BASE_URL}/contacts`;

const headers = {
  "api-key": SIB_APIKEY,
  "Content-Type": "application/json"
};
const sendInBlueBackend = {
  backendName: "SendInBlue",

  sendMail: function (mail: Mail) {
    const params = { body: mail.body ?? "" };

    const payload = {
      subject: mail.subject,
      to: mail.to,
      sender: {
        email: SENDER_EMAIL_ADDRESS,
        name: SENDER_NAME
      },
      cc: mail.cc,
      templateId: mail.templateId,
      params: params
    };
    if (!!mail.attachment) {
      payload["attachment"] = [
        {
          name: mail.attachment.name,
          content: mail.attachment.file
        }
      ];
    }

    const req = axios.post(SIB_SMTP_URL, payload, {
      headers: headers,
      timeout: 5000
    });
    return req
      .then(() => {
        const allRecipients = [...mail.to, ...(!!mail.cc ? mail.cc : [])];
        for (const recipient of allRecipients) {
          console.log(
            `Mail sent via SIB to ${recipient.email} - Subject: ${mail.subject}`
          );
        }
      })
      .catch(err => {
        if (!!SENTRY_DSN) {
          Sentry.captureException(err, {
            tags: {
              Mailer: "SendInBlue",
              Recipients: mail.to.map(el => el.email).join(" ")
            }
          });
        } else {
          console.log(err);
        }
      });
  },
  addContact: function (contact: Contact) {
    const req = axios.post(
      SIB_CONTACT_URL,
      {
        email: contact.email,
        NOM: contact.name // NOM is a custom SIB contact field
      },
      {
        headers
      }
    );
    req
      .then(() => {
        console.log(`Contact created on SIB: ${contact.email}`);
      })
      .catch(err => {
        console.log(err);
      });
  }
};

export default sendInBlueBackend;
