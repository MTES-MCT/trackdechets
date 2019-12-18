import { Form } from "../generated/prisma-client";
import { Context } from "../types";
import { getUserCompanies } from "../companies/helper";

const GROUP_CODES = ["D 13", "D 14", "D 15", "R 13"];

/**
 * Workflow:
 * See /docs/worflow.md for more details
 * */
export async function getNextPossibleStatus(form: Form, context: Context) {
  const userCompanies = await getUserCompanies(context.user.id);
  const actorSirets = userCompanies.map(c => c.siret);

  const isEmitter = actorSirets.includes(form.emitterCompanySiret);
  const isRecipient = actorSirets.includes(form.recipientCompanySiret);
  const isTransporter = actorSirets.includes(form.transporterCompanySiret);

  switch (form.status) {
    case "DRAFT":
      return isEmitter ? ["SEALED", "SENT"] : [];

    case "SEALED":
      // When both the transporter and the producer sign on the transporter device,
      // a transporter can initiate a "SENT" status change
      return isEmitter || isTransporter ? "SENT" : [];

    case "SENT":
      if (!isRecipient) {
        return [];
      }
      return form.isAccepted ? "RECEIVED" : "REFUSED";

    case "RECEIVED":
      if (!isRecipient) {
        return [];
      }
      if (!GROUP_CODES.includes(form.processingOperationDone)) {
        return "PROCESSED";
      }
      return form.noTraceability ? "NO_TRACEABILITY" : "AWAITING_GROUP";

    default:
      return [];
  }
}
