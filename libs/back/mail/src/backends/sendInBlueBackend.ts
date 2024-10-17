import { Mail, Contact, Recipient } from "../types";
import axios from "axios";
import * as Sentry from "@sentry/node";
import { logger } from "@td/logger";
import { splitArrayIntoChunks } from "../helpers";

const {
  SIB_APIKEY,
  SENDER_EMAIL_ADDRESS,
  SENDER_NAME,
  SENTRY_DSN,
  SIB_BASE_URL
} = process.env;

const SIB_SMTP_URL = `${SIB_BASE_URL}/smtp/email`;
const SIB_CONTACT_URL = `${SIB_BASE_URL}/contacts`;

// Really is 1000 but let's be cautious
export const MESSAGE_VERSIONS_BULK_LIMIT = 950;

const headers = {
  "api-key": SIB_APIKEY!,
  "Content-Type": "application/json"
};
const sendInBlueBackend = {
  backendName: "SendInBlue",

  sendMail: function (mail: Mail) {
    // Careful: SIB has a chunk limit for messageVersions
    if (
      mail.messageVersions &&
      mail.messageVersions.length > MESSAGE_VERSIONS_BULK_LIMIT
    ) {
      const messageVersionsChunks = splitArrayIntoChunks(
        mail.messageVersions,
        MESSAGE_VERSIONS_BULK_LIMIT
      );

      return Promise.all(
        messageVersionsChunks.map(chunk =>
          this.sendMail({ ...mail, messageVersions: [...chunk] })
        )
      );
    }

    const params = { body: mail.body ?? "", ...mail.params };

    const payload = {
      subject: mail.subject,
      to: mail.to,
      messageVersions: mail.messageVersions,
      sender: {
        email: SENDER_EMAIL_ADDRESS,
        name: SENDER_NAME
      },
      cc: mail.cc,
      templateId: mail.templateId,
      params: params
    };
    if (mail.attachment) {
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
        const allRecipients: Recipient[] = [];

        if (mail.to) {
          allRecipients.push(...mail.to);
        }

        if (mail.cc) {
          allRecipients.push(...mail.cc);
        }

        if (mail.messageVersions) {
          mail.messageVersions.forEach(messageVersion =>
            allRecipients.push(...messageVersion.to)
          );
        }

        for (const recipient of allRecipients) {
          logger.info(
            `Mail sent via SIB to ${recipient.email} - Subject: ${mail.subject}`
          );
        }
      })
      .catch(err => {
        if (SENTRY_DSN) {
          Sentry.captureException(err, {
            tags: {
              Mailer: "SendInBlue",
              Recipients: mail.to?.map(el => el.email).join(" ")
            }
          });
        } else {
          logger.error(err);
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
    return req
      .then(() => {
        logger.info(`Contact created on SIB: ${contact.email}`);
      })
      .catch(err => {
        logger.error(err);
      });
  }
};

export default sendInBlueBackend;
