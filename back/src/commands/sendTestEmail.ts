import sendMail from "../mailer/mailing";

const sendtestEmail = () => {
  const recipient = process.argv[2];
  sendMail({
    to: [{ email: recipient, name: recipient }],
    subject: "Email de test",
    title: "Email de test",
    body: "Bonjour, ceci est un email de test de Trackdéchets."
  });
};

sendtestEmail();
