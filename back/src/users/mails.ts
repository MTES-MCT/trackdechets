import { escape } from "querystring";
import { Company, Form, User } from "@prisma/client";
import {
  cleanupSpecialChars,
  toFrFormat,
  templateIds
} from "../mailer/helpers";
import { getUIBaseURL } from "../utils";
import {} from "../mailer/mailing";

const { UI_HOST, VIRTUAL_HOST } = process.env;

const baseUrl = `https://${UI_HOST}`;

export const quantityPartiallyRefused = (quantitySent, quantityAccepted) =>
  quantitySent - quantityAccepted;

export const userMails = {
  onSignup: (user, activationHash) => ({
    to: [{ email: user.email, name: user.name }],
    subject: "Activer votre compte sur Trackdéchets",
    title: "Activation de votre compte",
    body: `Bonjour ${user.name},
    <br>
    Vous venez de créer un compte sur Trackdéchets. Nous sommes ravis de vous compter parmi nous ! 🎉
    <br>
    Pour finaliser votre inscription, veuillez confirmer votre email <a href="https://${VIRTUAL_HOST}/userActivation?hash=${activationHash}">en cliquant ici.</a>
    <br>
    Une fois votre compte validé, vous pourrez créer votre établissement afin de commencer à gérer les bordereaux associés. Si l'établissement existe déjà, demandez à l'administrateur du compte au sein de votre entreprise de vous inviter à le rejoindre.
    <br>
    Pour rappel, Trackdéchets est un site en béta conçu par la Fabrique Numérique du Ministère de l'Ecologie et des Territoires.
    <br>
    Si vous avez la moindre interrogation, n’hésitez pas à nous contacter à l'email <a href="mailto:hello@trackdechets.beta.gouv.fr">hello@trackdechets.beta.gouv.fr</a>.`
  }),
  contentAwaitsGuest: (
    toEmail,
    toName,
    toCompanyName,
    toCompanySiret,
    fromCompanyName
  ) => ({
    to: [{ email: toEmail, name: toName }],
    subject:
      "Un BSD numérique vous attend sur Trackdéchets : créez votre compte pour y accéder !",
    title:
      "Un BSD numérique vous attend sur Trackdéchets : créez votre compte pour y accéder !",
    body: `Bonjour ${toName},
    <br><br>
    L'entreprise ${fromCompanyName} vient de créer un BSD dématérialisé disponible sur <a href="https://${UI_HOST}/">https://trackdechets.beta.gouv.fr</a> qui concerne votre entreprise ${toCompanyName} (SIRET: ${toCompanySiret}).
    <br><br>
    <strong>Qu’est-ce que Trackdéchets ?</strong>
    <br>
    Un outil du Ministère de la Transition Écologique et Solidaire qui permet notamment de <strong>simplifier la gestion quotidienne de la traçabilité des déchets dangereux en permettant une dématérialisation de bout en bout de la chaîne de traitement 💪.</strong>
    <br><br>
    <strong>Trackdéchets c’est accessible à tous ?</strong><br>
    Trackdéchets est gratuit et accessible à toutes les entreprises, générant ou traitant des déchets&nbsp;: producteurs, collecteurs / regroupeurs, transporteurs, installations de traitement.
    <br><br>
    <strong>Pourquoi Trackdéchets vous écrit aujourd’hui ?</strong><br>
    Ce message vous est adressé car <strong>l'entreprise qui vous a transmis ce bordereau dispose d'un compte sur Trackdéchets</strong> et son bordereau est en attente d'une action de votre part.
    <br><br>
    <strong>Comment aller voir ce BSD ?</strong>
    <br>
    Vous pouvez créer votre compte en cliquant <a href="https://${UI_HOST}/signup">sur ce lien</a> et en suivant la procédure d'inscription. C’est rapide, vous pouvez finaliser votre inscription en 3’ max une fois muni.e de votre SIRET. Vous pourrez alors commencer à utiliser Trackdéchets et découvrir ses fonctionnalités.
    <br><br>
    <strong>Vous avez déjà un outil de gestion des BSD, comment ça se passe?</strong>
    <br>
    Si vous disposez de votre propre solution, vous continuez comme avant et la mise en place des connections (via API) permettra de transmettre des BSD dématérialisés à vos clients et prestataires. Pour en <a href="https://doc.trackdechets.fr/">savoir plus</a>.
    <br><br>
    Si vous avez la moindre interrogation, n’hésitez pas à nous contacter à l'email <a href="mailto:hello@trackdechets.beta.gouv.fr">hello@trackdechets.beta.gouv.fr</a>.
  `
  }),
  inviteUserToJoin: (toEmail, companyAdmin, companyName, hash) => ({
    to: [{ email: toEmail, name: toEmail }],
    subject: "Vous avez été invité à rejoindre Trackdéchets",
    title: `${companyAdmin} vous a invité à rejoindre Trackdéchets`,
    body: `Bonjour Madame/Monsieur,
    <br><br>
    La personne en charge de la société <strong>${companyName}</strong> vous a invité à rejoindre Trackdéchets.
    <br>
    Pour finaliser la création de votre compte et commencer à utiliser la plateforme, cliquez <a href="${getUIBaseURL()}/invite?hash=${escape(
      hash
    )}">sur ce lien</a> et renseignez les informations demandées.
    <br>
    Vous aurez accès à l'ensemble des informations concernant l'entreprise <strong>${companyName}</strong>.
    `
  }),
  notifyUserOfInvite: (toEmail, toName, companyAdmin, companyName) => ({
    to: [{ email: toEmail, name: toName }],
    subject: "Vous avez été invité sur Trackdéchets",
    title: `${companyAdmin} vous a invité sur Trackdéchets`,
    body: `Bonjour ${toName},
    <br><br>
    La personne en charge de la société <strong>${companyName}</strong> vous a invité à rejoindre son organisation sur Trackdéchets.
    <br>
    Vous pouvez dès à présent accéder aux informations de cette entreprise sur le <a href="https://${UI_HOST}/">portail Trackdéchets</a>.
    <br>
    Vous aurez accès à l'ensemble des données concernant l'entreprise <strong>${companyName}</strong>.
    `
  }),
  resetPassword: (toEmail, toName, password) => ({
    to: [{ email: toEmail, name: toName }],
    subject: "Ré-initialisation du mot de passe",
    title:
      "Vous avez demandé à réinitialiser votre mot de passe sur Trackdéchets",
    body: `Bonjour ${toName}
    <br><br>
    Vous avez demandé à réinitialiser votre mot de passe sur Trackdéchets.<br>
    Vous pouvez désormais vous connecter avec votre nouveau mot de passe qui vient d'être généré: <strong>${password}</strong>.<br>
    Vous aurez la possibilité de modifier ce mot de passe sur la plateforme.<bt><br>
    Si vous n'êtes pas à l'origine de cette demande, merci d'en informer l'équipe de Trackdéchets au plus vite <a href="mailto:hello@trackdechets.beta.gouv.fr">par mail.</a>
    `
  }),
  formNotAccepted: (recipients, ccs, form: Form, attachment) => ({
    to: recipients,
    cc: ccs,
    subject: "Refus de prise en charge de votre déchet",
    title: "Refus de prise en charge de votre déchet",
    body: `Madame, Monsieur,
    <br><br>
    Nous vous informons que la société ${cleanupSpecialChars(
      form.recipientCompanyName
    )} a refusé le ${toFrFormat(
      new Date(form.receivedAt)
    )}, le déchet de la société suivante :
    <br><br>

    <ul>
    <li>${cleanupSpecialChars(form.emitterCompanyName)} - ${
      form.emitterCompanyAddress
    }
    </li>
    <li>Informations relatives aux déchets refusés :</li>
    <ul>
      <li>Numéro du BSD: ${form.readableId}</li>
      <li>Appellation du déchet : ${form.wasteDetailsName}</li>
      <li>Code déchet : ${form.wasteDetailsCode}</li>
      <li>Quantité : ${form.wasteDetailsQuantity} Tonnes refusées</li>
      <li>Motif de refus: ${
        form.wasteRefusalReason ? form.wasteRefusalReason : "Non précisé"
      }</li>
    </ul>
     <li>Transporteur : ${
       form.transporterIsExemptedOfReceipt
         ? "Exemption relevant de l'article R.541-50 du code de l'Environnement"
         : cleanupSpecialChars(form.transporterCompanyName)
     }</li>
     <li>Responsable du site : ${form.sentBy || ""}</li>
     </ul>
     Vous trouverez ci-joint la copie du BSD correspondant au refus mentionné ci-dessus.
    <br><br>
    Comme le prévoit l'article R541-45 du code de l'environnement, l'expéditeur initial du déchet et l'inspection des installations classées sont tenus informés de ce refus.
    <br><br>
    <strong>Ce message est transmis par Trackdéchets automatiquement lors d'un refus de déchets. Merci de prendre les dispositions nécessaires pour vous assurer du bon traitement de votre déchet.</strong>`,
    attachment
  }),
  formPartiallyRefused: (recipients, ccs, form: Form, attachment) => ({
    to: recipients,
    cc: ccs,
    subject: "Refus partiel de prise en charge de votre déchet",
    title: "Refus partiel de prise en charge de votre déchet",
    body: `Madame, Monsieur,
    <br><br>
    Nous vous informons que la société ${cleanupSpecialChars(
      form.recipientCompanyName
    )} a refusé partiellement le ${toFrFormat(
      new Date(form.receivedAt)
    )}, le déchet de la société suivante :
    <br><br>

    <ul>
    <li>${cleanupSpecialChars(form.emitterCompanyName)} - ${
      form.emitterCompanyAddress
    }
    </li>
    <li>Informations relatives aux déchets refusés :</li>
    <ul>
      <li>Numéro du BSD : ${form.readableId}</li>
      <li>Appellation du déchet : ${form.wasteDetailsName}</li>
      <li>Code déchet : ${form.wasteDetailsCode}</li>
      <li>Quantité refusée (estimée): ${quantityPartiallyRefused(
        form.wasteDetailsQuantity,
        form.quantityReceived
      )} Tonnes</li>
      <li>Quantité acceptée: ${form.quantityReceived} Tonnes</li>
      <li>Motif de refus : ${
        form.wasteRefusalReason ? form.wasteRefusalReason : "Non précisé"
      }</li>
    </ul>
     <li>Transporteur : ${
       form.transporterIsExemptedOfReceipt
         ? "Exemption relevant de l'article R.541-50 du code de l'Environnement"
         : cleanupSpecialChars(form.transporterCompanyName)
     }</li>
     <li>Responsable du site : ${form.sentBy || ""}</li>
     </ul>
     Vous trouverez ci-joint la copie du BSD correspondant au refus mentionné ci-dessus.
    <br><br>
    Comme le prévoit l'article R541-45 du code de l'environnement, l'expéditeur initial du déchet et l'inspection des installations classées sont tenus informés de ce refus.
    <br><br>
    <strong>Ce message est transmis par Trackdéchets automatiquement lors d'un refus partiel de déchets. Merci de prendre les dispositions nécessaires pour vous assurer du bon traitement de votre déchet.</strong>`,
    attachment
  }),
  onboardingFirstStep: (toEmail, toName) => ({
    to: [{ email: toEmail, name: toName }],
    subject: "Bienvenue sur Trackdéchets, démarrez dès aujourd’hui !",
    title: "Bienvenue sur Trackdéchets, démarrez dès aujourd’hui !",
    body: "_",
    templateId: templateIds.FIRST_ONBOARDING,
    baseUrl
  }),
  onboardingSecondStep: (toEmail, toName) => ({
    to: [{ email: toEmail, name: toName }],
    subject: "Registre, FAQ, explorez tout ce que peut faire Trackdéchets !",
    title: "Registre, FAQ, explorez tout ce que peut faire Trackdéchets !",
    body: "_",
    templateId: templateIds.SECOND_ONBOARDING,
    baseUrl
  }),
  formTraceabilityBreak: (toEmail: string, toName: string, form: Form) => ({
    to: [{ email: toEmail, name: toName }],
    cc: [
      { email: form.recipientCompanyMail, name: form.recipientCompanyContact }
    ],
    subject: "Trackdéchets : Votre déchet a été traité",
    title: "Trackdéchets : Votre déchet a été traité",
    body: `Madame, Monsieur,<br><br>

    Vous avez confié vos déchets à la société ${form.recipientCompanyName}.<br>
    Ces déchets sont accompagnés par le bordereau n° ${form.readableId} et tracés dans Trackdéchets.<br>
    La société ${form.recipientCompanyName} déclare être autorisée par arrêté préfectoral à une rupture de traçabilité pour le déchet suivant: ${form.wasteDetailsName} - ${form.wasteDetailsCode}
    <br><br>
    Aussi, je vous informe que le BSD est désormais disponible sur votre compte Trackdéchets, dans l'onglet "archives" et le restera durant 5 ans. Il n'est donc pas utile de l'imprimer.
    <br><br>
    Quelles conséquences pour vous? La responsabilité du déchet (au sens de l'article L541-2 du code de l'Env.) est transférée à la société ${form.recipientCompanyName}, votre registre est renseigné.`
  }),
  membershipRequestConfirmation: (user: User, company: Company) => ({
    to: [{ email: user.email, name: user.name }],
    subject: "Votre demande de rattachement a été transmise à l'administrateur",
    title: "Votre demande de rattachement a été transmise à l'administrateur",
    body: `Bonjour,
    <br/><br/>
    Votre demande de rattachement à l’entreprise ${company.name} (${company.siret}) a été transmise à l'administrateur de l’établissement.

    Si votre demande est acceptée, vous serez informé(e) par email.
    `
  }),
  membershipRequest: (
    recipients,
    membershipRequestLink: string,
    user: User,
    company: Company
  ) => ({
    to: recipients,
    subject: "Un utilisateur souhaite rejoindre votre établissement",
    title: "Un utilisateur souhaite rejoindre votre établissement",
    body: `Bonjour
    <br/><br/>
    L'utilisateur ${user.email} a demandé à rejoindre l'établissement ${company.name} (${company.siret})
    dont vous êtes administrateur.

    Pour valider ou refuser sa demande, cliquez sur
    <a href="${membershipRequestLink}">ce lien</a>.
    `
  }),
  membershipRequestAccepted: (user: User, company: Company) => ({
    to: [{ email: user.email, name: user.name }],
    subject: `Vous êtes à présent membre de l’établissement ${company.name} (${company.siret}) 🔔`,
    title: `Vous êtes à présent membre de l’établissement ${company.name} (${company.siret}) 🔔`,
    body: `Bonjour,
    <br/><br/>
    Votre demande de rattachement à l’entreprise ${company.name} (${company.siret}) a été acceptée par l'administrateur de l’établissement.

    Vous pourrez à présent effectuer des actions pour le compte de l’entreprise
    (créer / signer / suivre des BSD, accéder au registre, consulter les fiches entreprise, consulter le code de signature).
    `
  }),
  membershipRequestRefused: (user: User, company: Company) => ({
    to: [{ email: user.email, name: user.name }],
    subject:
      "Votre demande de rattachement a été refusée par l'administrateur de l’établissement",
    title:
      "Votre demande de rattachement a été refusée par l'administrateur de l’établissement",
    body: `Bonjour,
    <br/><br/>
    Votre demande de rattachement à l’entreprise ${company.name} (${company.siret}) a été refusée par l'administrateur de l’établissement.
    Vous ne pouvez donc pas effectuer d’action pour le compte de cette entreprise.
    `
  })
};
