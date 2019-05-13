import { escape } from "querystring";

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
    Pour finaliser votre inscription, veuillez confirmer votre email <a href="https://api.trackdechets.beta.gouv.fr/userActivation?hash=${activationHash}">en cliquant ici.</a>
    <br>
    Pour rappel, Trackdéchets est un site en béta conçu par la Fabrique Numérique du Ministère de l'Ecologie et des Territoires.
    <br>
    Si vous avez la moindre interrogation, n’hésitez pas à nous contacter à l'email <a href="mailto:emmanuel.flahaut@developpement-durable.gouv.fr">emmanuel.flahaut@developpement-durable.gouv.fr</a>.`
  }),
  contentAwaitsGuest: (toEmail, toName, toCompanyName, fromCompanyName) => ({
    toEmail,
    toName,
    subject: "Un BSD numérique vous attend sur Trackdéchets",
    title: "Un BSD numérique vous attend sur Trackdéchets",
    body: `Bonjour ${toName},
    <br>
    L'entreprise ${fromCompanyName} vient de créer un BSD dématérialisé disponible sur <a href="https://trackdechets.beta.gouv.fr/">https://trackdechets.beta.gouv.fr</a> qui concerne votre entreprise ${toCompanyName}.<br>
    Ce message vous est adressé car l'entreprise qui vous a transmis ce bordereau dispose d'un compte sur Trackdéchets et son bordereau est en attente d'une action de votre part.
    <br>
    Trackdéchets est un produit de la Fabrique Numérique du Ministère de la Transition Écologique et Solidaire.<br>
    Il permet entre autres, de dématérialiser la procédure liée aux bordereaux de suivi de déchets et de tracer le déchet jusqu'à son traitement final.
    <br>
    Vous pouvez créer votre compte en cliquant <a href="https://trackdechets.beta.gouv.fr/signup">sur ce lien</a> et en suivant la procédure d'inscription. Vous pourrez alors commencer à utiliser Trackdéchets.<br>
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
    Pour finaliser la création de votre compte et commencer à utiliser la plateforme, cliquez <a href="https://trackdechets.beta.gouv.fr/invite?hash=${escape(
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
    Vous pouvez dès à présent accéder aux informations de cette entreprise sur le <a href="https://trackdechets.beta.gouv.fr/">portail Trackdéchets</a>.
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
  })
};
