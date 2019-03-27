import { Form } from "../generated/prisma-client";

/**
 * Workflow:
 * Producteur: DRAFT -> SENT ------
 *                        |        |
 * Collecteur: DRAFT -> SEALED -> RECEIVED -> PROCESSED
 * */
export function getNextStep(form: Form, actorSirets: string[]) {
  if (actorSirets.includes(form.emitterCompanySiret)) {
    return getEmitterNextStep(form);
  }
  return getRecipientNextStep(form);
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

const GROUP_CODES = ["D 13", "D 14", "D 15", "R 13"];

function getRecipientNextStep(form: Form) {
  switch (form.status) {
    case "DRAFT":
      return "SEALED";
    case "SENT":
      return "RECEIVED";
    case "RECEIVED":
      if (GROUP_CODES.indexOf(form.processingOperationDone) > -1) {
        return "AWAITING_GROUP";
      }
      return "PROCESSED";
    case "SEALED":
      throw new Error(
        "En attente de la confirmation d'envoi des déchets par le producteur."
      );
    default:
      throw new Error("Il n'y a rien à valider");
  }
}
