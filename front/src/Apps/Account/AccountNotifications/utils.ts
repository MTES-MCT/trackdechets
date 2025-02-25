import { UserNotifications } from "@td/codegen-ui";

export const hintTexts: { [key in keyof UserNotifications]: string } = {
  membershipRequest:
    "Seuls les membres avec le rôle Administrateur sont en mesure de recevoir " +
    "et d'accepter / refuser / effectuer des demandes de rattachement à leur établissement. " +
    "Nous vous conseillons donc vivement, pour chaque établissement de conserver au moins un " +
    "administrateur abonné à ce type de notification.",
  signatureCodeRenewal:
    "Un courriel sera envoyé à chaque renouvellement du code de signature",
  bsdRefusal:
    "Un courriel sera envoyé à chaque refus total ou partiel d'un bordereau",
  bsdaFinalDestinationUpdate:
    "Un courriel sera envoyé lorsque le BSDA est envoyé à un exutoire différent, que le CAP " +
    "a fait l'objet d'une modification à la suite de la signature du producteur ou qu'une révision " +
    "a été approuvée par l'entreprise de travaux ou la destination sur les numéros de scellés et/ou conditionnement.",
  revisionRequest:
    "Un courriel sera envoyé à chaque fois qu'une révision sera restée sans réponse 14 jours après sa demande",
  registryDelegation:
    "Un courriel sera envoyé dès lors qu'une délégation est créée ou est sur le point d'expirer."
};
