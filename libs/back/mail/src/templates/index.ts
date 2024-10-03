import { BsddTransporter, CompanyVerificationMode, Form } from "@prisma/client";
import { cleanupSpecialChars, toFrFormat } from "../helpers";
import { MailTemplate } from "../types";
import { templateIds } from "./provider/templateIds";
import { mustacheRenderer } from "./renderers";

export const onSignup: MailTemplate<{ activationHash: string }> = {
  subject: "Activer votre compte sur Trackdéchets",
  body: mustacheRenderer("confirmation-de-compte.html"),
  templateId: templateIds.LAYOUT
};

export const inviteUserToJoin: MailTemplate<{
  hash: string;
  companyName: string;
  companyOrgId: string;
}> = {
  subject: "Vous avez été invité à rejoindre Trackdéchets",
  body: mustacheRenderer("invitation-par-administrateur.html"),
  templateId: templateIds.LAYOUT,
  prepareVariables: ({ hash, companyName, companyOrgId }) => {
    return {
      companyName,
      companyOrgId,
      hash: encodeURIComponent(hash)
    };
  }
};

export const notifyUserOfInvite: MailTemplate<{
  companyName: string;
  companyOrgId: string;
}> = {
  subject: "Vous avez été invité sur Trackdéchets",
  body: mustacheRenderer("notification-invitation.html"),
  templateId: templateIds.LAYOUT
};

export const yourCompanyIsIdentifiedOnABsd: MailTemplate<{
  emitter: { siret: string; name?: string };
  destination: { siret: string; name?: string };
}> = {
  subject:
    "Votre établissement a été identifié sur un bordereau de suivi de déchets dangereux sur Trackdéchets",
  body: mustacheRenderer("your-company-is-identified-on-a-bsd.html"),
  templateId: templateIds.LAYOUT
};

export const onboardingFirstStep: MailTemplate = {
  subject: "Bienvenue sur Trackdéchets, démarrez dès aujourd’hui !",
  templateId: templateIds.FIRST_ONBOARDING
};

export const createPasswordResetRequest: MailTemplate<{
  resetHash: string;
}> = {
  subject: "Ré-initialisation du mot de passe",
  body: mustacheRenderer("reinitialisation-mot-de-passe.html"),
  templateId: templateIds.LAYOUT
};

export const formNotAccepted: MailTemplate<{ form: Form & BsddTransporter }> = {
  subject: ({ form }) =>
    `Le déchet de l’entreprise ${form.emitterCompanyName} a été totalement refusé à réception`,
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
        signedAt: form.signedAt
          ? toFrFormat(new Date(form.signedAt))
          : form.signedAt,
        sentBy: form.sentBy ?? ""
      }
    };
  }
};

export const formPartiallyRefused: MailTemplate<{
  form: Form & BsddTransporter;
}> = {
  subject: ({ form }) =>
    `Le déchet de l’entreprise ${form.emitterCompanyName} a été partiellement refusé à réception`,
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
        signedAt: form.signedAt
          ? toFrFormat(new Date(form.signedAt))
          : form.signedAt,
        sentBy: form.sentBy ?? ""
      }
    };
  }
};

export const membershipRequestConfirmation: MailTemplate<{
  companyName: string;
  companySiret: string;
  adminEmailsInfo: string;
}> = {
  subject: "Votre demande de rattachement a été transmise à l'administrateur",
  body: mustacheRenderer("confirmation-demande-de-rattachement.html"),
  templateId: templateIds.LAYOUT
};

export const membershipRequest: MailTemplate<{
  userEmail: string;
  companyName: string;
  companySiret: string;
  companyGivenName: string;
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
  company: { name?: string; orgId: string };
}> = {
  subject: ({ company }) =>
    `Renouvellement du code de signature de votre établissement "${company.name}" (${company.orgId})`,
  body: mustacheRenderer("notification-renouvellement-code-signature.html"),
  templateId: templateIds.LAYOUT
};

export const verificationProcessInfo: MailTemplate<{
  company: { name?: string; orgId: string };
}> = {
  subject: ({ company }) =>
    `Établissement ${company.orgId} en cours de vérification`,
  body: mustacheRenderer("information-process-de-verification.html"),
  templateId: templateIds.LAYOUT
};

export const verificationDone: MailTemplate<{
  company: {
    name?: string;
    orgId: string;
    verificationMode: CompanyVerificationMode;
  };
}> = {
  subject: ({ company }) =>
    `L'établissement ${company.orgId} est désormais vérifié`,
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

export const verifiedForeignTransporterCompany: MailTemplate = {
  subject: "Welcome to Trackdéchets !",
  templateId: templateIds.VERIFIED_FOREIGN_TRANSPORTER_COMPANY
};

export const finalDestinationModified: MailTemplate<{
  id: string;
  emitter: { name?: string; siret: string };
  destination: { name?: string; siret: string };
  plannedDestination: { name?: string; siret: string };
}> = {
  subject: ({ id }) => `Alerte sur le bordereau ${id}`,
  body: mustacheRenderer("destination-finale-modifiee.html"),
  templateId: templateIds.LAYOUT
};

export const membershipRequestDetailsEmail: MailTemplate = {
  subject: "Passez à la prochaine étape sur Trackdéchets",
  body: mustacheRenderer("membership-request-details.html"),
  templateId: templateIds.LAYOUT
};

export const pendingMembershipRequestDetailsEmail: MailTemplate = {
  subject: "Suite à votre demande de rattachement sur Trackdéchets",
  body: mustacheRenderer("pending-membership-request-details.html"),
  templateId: templateIds.LAYOUT
};

export const pendingMembershipRequestAdminDetailsEmail: MailTemplate<{
  requestId: string;
  email: string;
  orgId: string;
}> = {
  subject: "Un utilisateur est toujours en attente de réponse de votre part",
  body: mustacheRenderer("pending-membership-request-admin-details.html"),
  templateId: templateIds.LAYOUT
};

export const profesionalsSecondOnboardingEmail: MailTemplate = {
  subject:
    "Signature dématérialisée, tableau de bord, explorez tout ce que fait Trackdéchets !",
  templateId: templateIds.PROFESIONAL_SECOND_ONBOARDING
};

export const producersSecondOnboardingEmail: MailTemplate = {
  subject:
    "Signature dématérialisée, tableau de bord, explorez tout ce que fait Trackdéchets !",
  templateId: templateIds.PRODUCER_SECOND_ONBOARDING
};

export const pendingRevisionRequestAdminDetailsEmail: MailTemplate<{
  requestCreatedAt: string;
  bsdReadableId: string;
  bsdId: string;
  companyName: string;
  companyOrgId: string;
}> = {
  subject: "Votre action est attendue sur une demande de révision",
  body: mustacheRenderer("pending-revision-request-admin-details.html"),
  templateId: templateIds.LAYOUT
};
