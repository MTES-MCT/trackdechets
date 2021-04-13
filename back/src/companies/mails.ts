const { UI_HOST } = process.env;
import { Company, CompanyVerificationMode } from "@prisma/client";
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
  }),
  verificationProcessInfo: (recipients, company: Company) => ({
    body: `
      Vous venez de créer l'établissement ${company.name} (${company.siret}) sur la plateforme Trackdéchets.
      <br/>
      L'établissement est en cours de vérification par nos équipes. Si la vérification manuelle n'aboutit pas, vous
      recevrez d'ici quelques jours un courrier contenant un code de vérification à l'adresse enregistrée auprès du
      registre du commerce et des sociétés.
      <br/>
      Dans l'attente de cette vérification, vous ne serez pas en mesure d'inviter
      de nouveaux membres et l'établissement ne pourra pas être visé en tant que
      destinataire sur un BSD numérique.
      <br/>
      Vous pouvez suivre l'état d'avancement de la vérification depuis votre compte Trackdéchets
      Mon Compte > Établissements > ${company.siret} > Information > Profil vérifié
      <br /><br />
      L'équipe Trackdéchets
      `,
    subject: `Établissement ${company.siret} en cours de vérification`,
    title: `Établissement ${company.siret} en cours de vérification`,
    to: recipients
  }),
  verificationDone: (recipients, company: Company) => {
    return {
      body: `
      L'établissement ${company.name} (${
        company.siret
      }) a bien été vérifié suite ${
        company.verificationMode === CompanyVerificationMode.LETTER
          ? "au renseignement du code de vérification envoyé par courrier"
          : "aux vérifications effectuées par nos équipes"
      }. <br/>
      Vous pouvez désormais inviter de nouveaux membres et l'établissement peut désormais
      être visé en tant que destinataire d'un BSD numérique.
      <br /><br />
      L'équipe Trackdéchets
    `,
      subject: `L'établissement ${company.siret} est désormais vérifié`,
      title: `L'établissement ${company.siret} est désormais vérifié`,
      to: recipients
    };
  }
};
