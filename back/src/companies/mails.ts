const { UI_HOST } = process.env;
import { templateIds } from "../mailer/helpers";
const baseUrl = `https://${UI_HOST}`;

const templateId = templateIds.SECURITY_CODE_RENEWAL;

export const companyMails = {
  securityCodeRenewal: (
    recipients,
    company: { siret: string; name?: string }
  ) => ({
    to: recipients,
    subject: "Renouvellement du code de signature sur Trackdéchets",
    title: "_",
    body: "_",
    templateId,
    baseUrl,
    vars: {
      company
    }
  })
};
