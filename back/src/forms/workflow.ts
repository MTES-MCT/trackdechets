import { Form } from "../generated/prisma-client";

/**
 * Workflow:
 * Producteur: DRAFT -> SENT ------
 *                        |        |
 * Collecteur: DRAFT -> SEALED -> RECEIVED -> PROCESSED
 * */
export function getNextStep(form: Form, actorSiret: string) {
  switch (actorSiret) {
    case form.emitterCompanySiret:
      return getEmitterNextStep(form);
    case form.recipientCompanySiret:
      return getRecipientNextStep(form);
  }
}

function getEmitterNextStep(form: Form) {
  switch (form.status) {
    case "DRAFT":
      return "SEALED";
    case "SEALED":
      return "SENT";
    default:
      throw new Error("Il n'y a rien à valider.");
  }
}

function getRecipientNextStep(form: Form) {
  switch (form.status) {
    case "DRAFT":
      return "SEALED";
    case "SENT":
      return "RECEIVED";
    case "RECEIVED":
      return "PROCESSED";
    case "SEALED":
      throw new Error(
        "En attente de la confirmation d'envoi des déchets par le producteur."
      );
    default:
      throw new Error("Il n'y a rien à valider");
  }
}
