import { CompanyVerificationMode, Form } from ".prisma/client";
import { cleanupSpecialChars, toFrFormat } from "../helpers";
import { MailTemplate } from "../types";
import templateIds from "./provider/templateIds";
import { mustacheRenderer } from "./renderers";

export const onSignup: MailTemplate<{ activationHash: string }> = {
  subject: "Activer votre compte sur Trackdéchets",
  body: mustacheRenderer("confirmation-de-compte.html"),
  templateId: templateIds.LAYOUT
};

export const inviteUserToJoin: MailTemplate<{
  hash: string;
  companyName: string;
}> = {
  subject: "Vous avez été invité à rejoindre Trackdéchets",
  body: mustacheRenderer("invitation-par-administrateur.html"),
  templateId: templateIds.LAYOUT,
  prepareVariables: ({ hash, companyName }) => ({
    companyName,
    hash: encodeURIComponent(hash)
  })
};

export const notifyUserOfInvite: MailTemplate<{
  companyName: string;
}> = {
  subject: "Vous avez été invité sur Trackdéchets",
  body: mustacheRenderer("notification-invitation.html"),
  templateId: templateIds.LAYOUT
};

export const contentAwaitsGuest: MailTemplate<{
  company: { siret: string; name?: string };
}> = {
  subject: "Votre Bordereau de Suivi de Déchet",
  body: mustacheRenderer("suite-transmission-bsd.html"),
  templateId: templateIds.LAYOUT
};

export const onboardingFirstStep: MailTemplate = {
  subject: "Bienvenue sur Trackdéchets, démarrez dès aujourd’hui !",
  templateId: templateIds.FIRST_ONBOARDING
};

export const onboardingProducerSecondStep: MailTemplate = {
  subject:
    "Signature dématérialisée, tableau de bord, explorez tout ce que fait Trackdéchets !",
  templateId: templateIds.PRODUCER_SECOND_ONBOARDING
};

export const onboardingProfessionalSecondStep: MailTemplate = {
  subject:
    "Trackdéchets vous accompagne pour mettre en oeuvre la traçabilité dématérialisée",
  templateId: templateIds.PROFESSIONAL_SECOND_ONBOARDING
};

export const resetPassword: MailTemplate<{ password: string }> = {
  subject: "Ré-initialisation du mot de passe",
  body: mustacheRenderer("reinitialisation-mot-de-passe.html"),
  templateId: templateIds.LAYOUT
};

export const formNotAccepted: MailTemplate<{ form: Form }> = {
  subject: "Refus de prise en charge de votre déchet",
  body: mustacheRenderer("refus-total-dechet.html"),
  templateId: templateIds.LAYOUT,
  prepareVariables: ({ form }) => {
    return {
      form: {
        ...form,
        recipientCompanyName: cleanupSpecialChars(form.recipientCompanyName),
        transporterCompanyName: cleanupSpecialChars(
          form.transporterCompanyName
        ),
        receivedAt: form.receivedAt
          ? toFrFormat(new Date(form.receivedAt))
          : form.receivedAt,
        sentBy: form.sentBy ?? ""
      }
    };
  }
};

export const formPartiallyRefused: MailTemplate<{ form: Form }> = {
  subject: "Refus partiel de prise en charge de votre déchet",
  body: mustacheRenderer("refus-partiel-dechet.html"),
  templateId: templateIds.LAYOUT,
  prepareVariables: ({ form }) => {
    return {
      form: {
        ...form,
        recipientCompanyName: cleanupSpecialChars(form.recipientCompanyName),
        transporterCompanyName: cleanupSpecialChars(
          form.transporterCompanyName
        ),
        quantityPartiallyRefused:
          form.wasteDetailsQuantity - form.quantityReceived,
        receivedAt: form.receivedAt
          ? toFrFormat(new Date(form.receivedAt))
          : "",
        sentBy: form.sentBy ?? ""
      }
    };
  }
};

export const membershipRequestConfirmation: MailTemplate<{
  companyName: string;
  companySiret: string;
}> = {
  subject: "Votre demande de rattachement a été transmise à l'administrateur",
  body: mustacheRenderer("confirmation-demande-de-rattachement.html"),
  templateId: templateIds.LAYOUT
};

export const membershipRequest: MailTemplate<{
  userEmail: string;
  companyName: string;
  companySiret: string;
  membershipRequestId: string;
}> = {
  subject: "Un utilisateur souhaite rejoindre votre établissement",
  body: mustacheRenderer("information-demande-de-rattachement.html"),
  templateId: templateIds.LAYOUT
};

export const membershipRequestAccepted: MailTemplate<{
  companyName: string;
  companySiret: string;
}> = {
  subject: ({ companyName, companySiret }) =>
    `Vous êtes à présent membre de l’établissement ${companyName} (${companySiret}) 🔔`,
  body: mustacheRenderer("demande-de-rattachement-acceptee.html"),
  templateId: templateIds.LAYOUT
};

export const membershipRequestRefused: MailTemplate<{
  companyName: string;
  companySiret: string;
}> = {
  subject:
    "Votre demande de rattachement a été refusée par l'administrateur de l’établissement",
  body: mustacheRenderer("demande-de-rattachement-refusee.html"),
  templateId: templateIds.LAYOUT
};

export const securityCodeRenewal: MailTemplate<{
  company: { name?: string; siret: string };
}> = {
  subject: "Renouvellement du code de signature sur Trackdéchets",
  templateId: templateIds.SECURITY_CODE_RENEWAL
};

export const verificationProcessInfo: MailTemplate<{
  company: { name?: string; siret: string };
}> = {
  subject: ({ company }) =>
    `Établissement ${company.siret} en cours de vérification`,
  body: mustacheRenderer("information-process-de-verification.html"),
  templateId: templateIds.LAYOUT
};

export const verificationDone: MailTemplate<{
  company: {
    name?: string;
    siret: string;
    verificationMode: CompanyVerificationMode;
  };
}> = {
  subject: ({ company }) =>
    `L'établissement ${company.siret} est désormais vérifié`,
  body: mustacheRenderer("etablissement-verifie.html"),
  templateId: templateIds.LAYOUT,
  prepareVariables: ({ company }) => ({
    company: {
      ...company,
      verificationModeIsLetter:
        company.verificationMode === CompanyVerificationMode.LETTER
    }
  })
};
