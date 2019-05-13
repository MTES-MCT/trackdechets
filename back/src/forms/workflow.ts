import { Form } from "../generated/prisma-client";

/**
 * Workflow:
 * See /docs/worflow.md for more details
 * */
export function getNextStep(form: Form, actorSirets: string[]) {
  if (
    actorSirets.includes(form.emitterCompanySiret) &&
    ["DRAFT", "SEALED"].includes(form.status) // To handle cases where you are both emitter & recipient
  ) {
    return getEmitterNextStep(form);
  }
  if (actorSirets.includes(form.recipientCompanySiret)) {
    return getRecipientNextStep(form);
  }
  throw new Error("Vous ne pouvez pas changer le statut de ce bordereau.");
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
      if (GROUP_CODES.indexOf(form.processingOperationDone) === -1) {
        return "PROCESSED";
      }
      if (form.noTraceability) {
        return "NO_TRACEABILITY";
      }
      return "AWAITING_GROUP";
    case "SEALED":
      throw new Error(
        "En attente de la confirmation d'envoi des déchets par le producteur."
      );
    default:
      throw new Error("Il n'y a rien à valider");
  }
}
