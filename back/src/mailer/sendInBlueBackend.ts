import { Mail, Contact } from "./types";
import axios from "axios";
const SIB_BASE_URL = "https://api.sendinblue.com/v3";
const SIB_SMTP_URL = `${SIB_BASE_URL}/smtp/email`;
const SIB_CONTACT_URL = `${SIB_BASE_URL}/contacts`;
const SIB_API_KEY = process.env.SIB_APIKEY;
const SIB_MAIN_TEMPLATE_ID = 2;

const headers = {
  "api-key": SIB_API_KEY,
  "Content-Type": "application/json"
};
const sendInBlueBackend = {
  backendName: "SendInBlue",

  sendMail: function(mail: Mail) {
    const params = { title: mail.title, body: mail.body };

    const req = axios.post(
      SIB_SMTP_URL,
      {
        subject: mail.subject,
        to: mail.to,
        sender: {
          email: process.env.SENDER_EMAIL_ADDRESS,
          name: process.env.SENDER_NAME
        },
        templateId: SIB_MAIN_TEMPLATE_ID,
        params: params
      },
      {
        headers
      }
    );
    req
      .then(function(response) {
        // handle success
        console.log(response);
      })
      .catch(function(error) {
        // handle error
        console.log(error);
      });
  },
  addContact: function(contact: Contact) {
    const req = axios.post(
      SIB_CONTACT_URL,
      {
        email: contact.email,
        NOM: contact.name
      },
      {
        headers
      }
    );
    req
      .then(function(response) {
        // handle success
        console.log(response);
      })
      .catch(function(error) {
        // handle error
        console.log(error);
      });
  }
};

export default sendInBlueBackend;
