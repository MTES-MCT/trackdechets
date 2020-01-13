const { UI_HOST, MJ_SECURITY_CODE_RENEWAL_TEMPLATE_ID } = process.env;

const baseUrl = `https://${UI_HOST}`;

export const companyMails = {
  securityCodeRenewal: (
    toEmail,
    toName,
    company: { siret: string; name?: string }
  ) => ({
    toEmail,
    toName,
    subject: "Renouvellement du code de sécurité sur Trackdéchets",
    title: "_",
    body: "_",
    templateId: parseInt(MJ_SECURITY_CODE_RENEWAL_TEMPLATE_ID, 10),
    baseUrl,
    vars: {
      company
    }
  })
};
