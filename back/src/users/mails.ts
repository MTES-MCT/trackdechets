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
  contentAwaitsGuest: (toEmail, toName) => ({
    toEmail,
    toName,
    subject: "Un bordereau vous attend sur Trackdéchets",
    title: "Un bordereau vous attend sur Trackdéchets",
    body: `Bonjour ${toName},
    <br>
    Vous avez reçu un BSD dématérialisé disponible sur <a href="https://trackdechets.beta.gouv.fr/">https://trackdechets.beta.gouv.fr</a><br>
    Ce message vous est adressé car l'entreprise qui vous a transmis ce bordereau dispose d'un compte sur Trackdéchets et son bordereau est en attente d'une action de votre part (confirmation de la réception et/ou du traitement du déchet).
    <br>
    Trackdéchets est un produit de la Fabrique Numérique du Ministère de la Transition Écologique et Solidaire.<br>
    Il permet entre autres, de dématérialiser la procédure liée aux bordereaux de suivi de déchets et de tracer le déchet jusqu'à son traitement final.
    <br>
    Vous pouvez créer votre compte en cliquant <a href="https://trackdechets.beta.gouv.fr/signup">sur ce lien</a> et en suivant la procédure d'inscription. Vous pourrez alors commencer à utiliser Trackdéchets.
  `
  })
};
