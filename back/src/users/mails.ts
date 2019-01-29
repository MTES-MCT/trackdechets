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
  })
};
