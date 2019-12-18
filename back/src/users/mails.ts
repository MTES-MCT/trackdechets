import { escape } from "querystring";
import { Form } from "../generated/prisma-client";
import { cleanupSpecialChars, toFrFormat } from "../common/mails.helper";

const {
  UI_HOST,
  VIRTUAL_HOST,
  MJ_FIRST_ONBOARDING_TEMPLATE_ID,
  MJ_SECOND_ONBOARDING_TEMPLATE_ID
} = process.env;

const baseUrl = `https://${UI_HOST}`;

export const userMails = {
  onSignup: (user, activationHash) => ({
    toEmail: user.email,
    toName: user.name,
    subject: "Activer votre compte sur Trackdéchets",
    title: "Activation de votre compte",
    body: `Bonjour ${user.name},
    <br>
    Vous venez de créer un compte sur Trackdéchets. Nous sommes ravis de vous compter parmi nous ! 🎉
    <br>
    Pour finaliser votre inscription, veuillez confirmer votre email <a href="https://${VIRTUAL_HOST}/userActivation?hash=${activationHash}">en cliquant ici.</a>
    <br>
    Pour rappel, Trackdéchets est un site en béta conçu par la Fabrique Numérique du Ministère de l'Ecologie et des Territoires.
    <br>
    Si vous avez la moindre interrogation, n’hésitez pas à nous contacter à l'email <a href="mailto:emmanuel.flahaut@developpement-durable.gouv.fr">emmanuel.flahaut@developpement-durable.gouv.fr</a>.`
  }),
  contentAwaitsGuest: (
    toEmail,
    toName,
    toCompanyName,
    toCompanySiret,
    fromCompanyName
  ) => ({
    toEmail,
    toName,
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
    Si vous avez la moindre interrogation, n’hésitez pas à nous contacter à l'email <a href="mailto:emmanuel.flahaut@developpement-durable.gouv.fr">emmanuel.flahaut@developpement-durable.gouv.fr</a>.
  `
  }),
  inviteUserToJoin: (toEmail, companyAdmin, companyName, hash) => ({
    toEmail,
    toName: toEmail,
    subject: "Vous avez été invité à rejoindre Trackdéchets",
    title: `${companyAdmin} vous a invité à rejoindre Trackdéchets`,
    body: `Bonjour Madame/Monsieur,
    <br><br>
    La personne en charge de la société <strong>${companyName}</strong> vous a invité à rejoindre Trackdéchets.
    <br>
    Pour finaliser la création de votre compte et commencer à utiliser la plateforme, cliquez <a href="https://${UI_HOST}/invite?hash=${escape(
      hash
    )}">sur ce lien</a> et renseignez les informations demandées.
    <br>
    Vous aurez accès à l'ensemble des informations concernant l'entreprise <strong>${companyName}</strong>.
    `
  }),
  notifyUserOfInvite: (toEmail, toName, companyAdmin, companyName) => ({
    toEmail,
    toName,
    subject: "Vous avez été invité sur Trackdéchets",
    title: `${companyAdmin} vous a invité à sur Trackdéchets`,
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
    toEmail,
    toName,
    subject: "Ré-initialisation du mot de passe",
    title:
      "Vous avez demandé à réinitialiser votre mot de passe sur Trackdéchets",
    body: `Bonjour ${toName}
    <br><br>
    Vous avez demandé à réinitialiser votre mot de passe sur Trackdéchets.<br>
    Vous pouvez désormais vous connecter avec votre nouveau mot de passe qui vient d'être généré: <strong>${password}</strong>.<br>
    Vous aurez la possibilité de modifier ce mot de passe sur la plateforme.<bt><br>
    Si vous n'êtes pas à l'origine de cette demande, merci d'en informer l'équipe de Trackdéchets au plus vite <a href="mailto:emmanuel.flahaut@developpement-durable.gouv.fr">par mail.</a>
    `
  }),
  formNotAccepted: (toEmail, toName, form: Form, attachment) => ({
    toEmail,
    toName,
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
    attachment: attachment
  }),
  onboardingFirstStep: (toEmail, toName) => ({
    toEmail,
    toName,
    subject: "Bienvenue sur Trackdéchets, démarrez dès aujourd’hui !",
    title: "Bienvenue sur Trackdéchets, démarrez dès aujourd’hui !",
    body: "_",
    templateId: parseInt(MJ_FIRST_ONBOARDING_TEMPLATE_ID, 10),
    baseUrl: baseUrl
  }),
  onboardingSecondStep: (toEmail, toName) => ({
    toEmail,
    toName,
    subject: "Registre, FAQ, explorez tout ce que peut faire Trackdéchets !",
    title: "Registre, FAQ, explorez tout ce que peut faire Trackdéchets !",
    body: "_",
    templateId: parseInt(MJ_SECOND_ONBOARDING_TEMPLATE_ID, 10),
    baseUrl: baseUrl
  })
};
