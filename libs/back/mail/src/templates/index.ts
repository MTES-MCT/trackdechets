import {
  BsddTransporter,
  Company,
  CompanyVerificationMode,
  Form
} from "@td/prisma";
import { cleanupSpecialChars, toFrFormat } from "../helpers";
import { MailTemplate } from "../types";
import { templateIds } from "./provider/templateIds";
import { mustacheRenderer } from "./renderers";

const { UI_HOST } = process.env;

// URL permettant de gérer les préférences de notifications par e-mail
const handlePreferencesUrl = `${UI_HOST}/account/notifications`;

export const onTotpActivated: MailTemplate<{ name: string }> = {
  subject: "Double authentification activée sur votre compte Trackdéchets",
  body: mustacheRenderer("totp-activated.html"),
  templateId: templateIds.LAYOUT
};

export const onTotpDisabled: MailTemplate<{ name: string }> = {
  subject: "Double authentification désactivée sur votre compte Trackdéchets",
  body: mustacheRenderer("totp-disabled.html"),
  templateId: templateIds.LAYOUT
};

export const onSignup: MailTemplate<{ activationHash: string }> = {
  subject: "Activer votre compte sur Trackdéchets",
  body: mustacheRenderer("confirmation-de-compte.html"),
  templateId: templateIds.LAYOUT
};

export const onSignupExistingUser: MailTemplate = {
  subject: "Vous avez déjà un compte sur Trackdéchets",
  body: mustacheRenderer("confirmation-de-compte-existant.html"),
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
  templateId: templateIds.LAYOUT,
  // permet de cacher le message "Vous avez reçu cet e-mail car vous
  // êtes inscrit sur la plateforme Trackdéchets" dans le template Brevo
  params: { hideRegisteredUserInfo: true }
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
  },
  params: {
    // permet d'afficher le lien "Gérer mes préférences e-mails"
    handlePreferencesUrl
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
  },
  params: {
    // permet d'afficher le lien "Gérer mes préférences e-mails"
    handlePreferencesUrl
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
  body: mustacheRenderer("membership-request.html"),
  templateId: templateIds.LAYOUT,
  params: {
    // permet d'afficher le lien "Gérer mes préférences e-mails"
    handlePreferencesUrl
  }
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
  templateId: templateIds.LAYOUT,
  params: {
    // permet d'afficher le lien "Gérer mes préférences e-mails"
    handlePreferencesUrl
  }
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
  templateId: templateIds.LAYOUT,
  params: {
    // permet d'afficher le lien "Gérer mes préférences e-mails"
    handlePreferencesUrl
  }
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

export const pendingMembershipRequestEmail: MailTemplate<{
  requestId: string;
  email: string;
  orgId: string;
}> = {
  subject: "Un utilisateur est toujours en attente de réponse de votre part",
  body: mustacheRenderer("pending-membership-request.html"),
  templateId: templateIds.LAYOUT,
  params: {
    // permet d'afficher le lien "Gérer mes préférences e-mails"
    handlePreferencesUrl
  }
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

export const pendingRevisionRequestEmail: MailTemplate<{
  requestCreatedAt: string;
  bsdReadableId: string;
  bsdId: string;
  companyName: string;
  companyOrgId: string;
}> = {
  subject: "Votre action est attendue sur une demande de révision",
  body: mustacheRenderer("pending-revision-request-admin-details.html"),
  templateId: templateIds.LAYOUT,
  params: {
    // permet d'afficher le lien "Gérer mes préférences e-mails"
    handlePreferencesUrl
  }
};

export const registryDelegationCreation: MailTemplate<{
  startDate: string;
  delegator: Company;
  delegate: Company;
  endDate?: string;
}> = {
  subject: ({ delegator }) =>
    `Émission d'une demande de délégation de l'établissement ${delegator.name} (${delegator.siret})`,
  body: mustacheRenderer("registry-delegation-creation.html"),
  templateId: templateIds.LAYOUT,
  params: {
    // permet d'afficher le lien "Gérer mes préférences e-mails"
    handlePreferencesUrl
  }
};

export const expiringRegistryDelegationWarning: MailTemplate<{
  delegator: Company;
  delegate: Company;
  startDate: string;
  endDate: string;
}> = {
  subject: ({ delegator, delegate }) =>
    `Expiration prochaine de la délégation entre l'établissement ${delegator.orgId} et l'établissement ${delegate.orgId}`,
  body: mustacheRenderer("expiring-registry-delegation-warning.html"),
  templateId: templateIds.LAYOUT,
  params: {
    // permet d'afficher le lien "Gérer mes préférences e-mails"
    handlePreferencesUrl
  }
};

export const bsdaDestinationCapModificationEmail: MailTemplate<{
  bsdaId: string;
  previousCap: string;
  newCap: string;
  workerCompanyName: string;
  workerCompanySiret: string;
  destinationCompanyName: string;
  destinationCompanySiret: string;
}> = {
  subject: ({ bsdaId, newCap }) =>
    `CAP du bordereau amiante n° ${bsdaId} mis à jour par ${newCap}`,
  body: mustacheRenderer("bsda-destinationCap-modification-email.html"),
  templateId: templateIds.LAYOUT,
  params: {
    // permet d'afficher le lien "Gérer mes préférences e-mails"
    handlePreferencesUrl
  }
};

type CompanyNameAndSiret = {
  name: string | undefined | null;
  siret: string | undefined | null;
};
export const bsdaWasteSealNumbersOrPackagingsRevision: MailTemplate<{
  bsdaId: string;
  author: CompanyNameAndSiret;
  approver: CompanyNameAndSiret;
  worker: CompanyNameAndSiret;
  destination: CompanyNameAndSiret;
  wasteSealNumbersBeforeRevision: string;
  wasteSealNumbersAfterRevision: string;
  packagingsBeforeRevision: string;
  packagingsAfterRevision: string;
}> = {
  subject: ({
    bsdaId,
    wasteSealNumbersBeforeRevision,
    packagingsBeforeRevision
  }) => {
    if (wasteSealNumbersBeforeRevision && packagingsBeforeRevision) {
      return `Scellés et conditionnement du bordereau amiante n° ${bsdaId} mis à jour`;
    } else if (wasteSealNumbersBeforeRevision) {
      return `Scellés du bordereau amiante n° ${bsdaId} mis à jour`;
    } else {
      return `Conditionnement du bordereau amiante n° ${bsdaId} mis à jour`;
    }
  },
  body: mustacheRenderer("bsda-wasteSealNumbers-or-packagings-revision.html"),
  templateId: templateIds.LAYOUT,
  params: {
    // permet d'afficher le lien "Gérer mes préférences e-mails"
    handlePreferencesUrl
  }
};

export const adminRequestInitialWarningToAdminEmail: MailTemplate<{
  company: { name: string; orgId: string };
  user: { name: string; email: string };
  isValidationByCollaboratorApproval: boolean;
  isValidationByMail: boolean;
  adminRequest: { id: string };
}> = {
  subject: ({ company }) =>
    `Demande de droits administrateur pour l'établissement ${company.name} - ${company.orgId}`,
  body: mustacheRenderer("admin-request-initial-warning-to-admin.html"),
  templateId: templateIds.LAYOUT
};

export const adminRequestInitialInfoToAuthorEmail: MailTemplate<{
  company: { name: string; orgId: string };
  isValidationByCollaboratorApproval: boolean;
  isValidationByMail: boolean;
}> = {
  subject: ({ company }) =>
    `Votre demande de droits administrateur pour l'établissement ${company.name} - ${company.orgId}`,
  body: mustacheRenderer("admin-request-initial-info-to-author.html"),
  templateId: templateIds.LAYOUT
};

export const adminRequestRefusedEmail: MailTemplate<{
  company: { name: string; orgId: string };
}> = {
  subject: () => `Demande de droits administrateur refusée`,
  body: mustacheRenderer("admin-request-refused.html"),
  templateId: templateIds.LAYOUT
};

export const adminRequestAcceptedEmail: MailTemplate<{
  company: { name: string; orgId: string };
}> = {
  subject: () => `Demande de droits administrateur acceptée`,
  body: mustacheRenderer("admin-request-accepted.html"),
  templateId: templateIds.LAYOUT
};

export const adminRequestAcceptedAdminEmail: MailTemplate<{
  company: { name: string; orgId: string };
  user: { name: string };
}> = {
  subject: () => `Mise à jour concernant la demande de droits administrateur`,
  body: mustacheRenderer("admin-request-accepted-admin.html"),
  templateId: templateIds.LAYOUT
};

export const adminRequestRefusedAdminEmail: MailTemplate<{
  company: { name: string; orgId: string };
  user: { name: string };
}> = {
  subject: () => `Mise à jour concernant la demande de droits administrateur`,
  body: mustacheRenderer("admin-request-refused-admin.html"),
  templateId: templateIds.LAYOUT
};

export const adminRequestCollaboratorEmail: MailTemplate<{
  company: { name: string; orgId: string };
  user: { name: string };
  adminRequest: { id: string };
}> = {
  subject: ({ company }) =>
    `Demande de droits administrateur pour l'établissement ${company.name} - ${company.orgId}`,
  body: mustacheRenderer("admin-request-collaborator.html"),
  templateId: templateIds.LAYOUT
};
