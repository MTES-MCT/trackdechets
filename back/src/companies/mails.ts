const { UI_HOST } = process.env;
import { templateIds } from "../mailer/helpers";
const baseUrl = `https://${UI_HOST}`;

const templateId = templateIds.SECURITY_CODE_RENEWAL_TEMPLATE_ID;

export const companyMails = {
  securityCodeRenewal: (
    recipients,
    company: { siret: string; name?: string }
  ) => ({
    to: recipients,
    subject: "Renouvellement du code de sécurité sur Trackdéchets",
    title: "_",
    body: "_",
    templateId: parseInt(templateId, 10),
    baseUrl,
    vars: {
      company
    }
  })
};
