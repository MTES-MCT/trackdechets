import { sendMail } from "../mailer/mailing";
import { templateIds } from "@td/mail";

/**
 * Send a test email to a given address from command line
 * node path/commands/sentestEmail foo@bar.baz
 */
const sendtestEmail = () => {
  const recipient = process.argv[2];
  sendMail({
    to: [{ email: recipient, name: recipient }],
    subject: "Email de test",
    body: "Bonjour, ceci est un email de test de Trackdéchets.",
    templateId: templateIds.LAYOUT
  });
};

sendtestEmail();
