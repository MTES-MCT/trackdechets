import { FormSubscriptionPayload, prisma } from "../generated/prisma-client";
import { sendMail } from "../common/mails.helper";
import { userMails } from "../users/mails";

export async function formsSubscriptionCallback(
  payload: FormSubscriptionPayload
) {
  mailToInexistantRecipient(payload).catch(err =>
    console.error("Error on inexistant recipient subscription", err)
  );
  mailToInexistantEmitter(payload).catch(err =>
    console.error("Error on inexistant emitter subscription", err)
  );
}

async function mailToInexistantRecipient(payload: FormSubscriptionPayload) {
  if (payload.updatedFields && payload.updatedFields.includes("isDeleted")) {
    return;
  }

  const previousRecipientSiret = payload.previousValues
    ? payload.previousValues.recipientCompanySiret
    : null;
  const recipientSiret = payload.node.recipientCompanySiret;
  const recipientMail = payload.node.recipientCompanyMail;
  const recipientName =
    payload.node.recipientCompanyName || "Monsieur / Madame";

  if (
    !recipientSiret ||
    !recipientMail ||
    previousRecipientSiret === recipientSiret
  ) {
    return;
  }

  const companyExists = await prisma.$exists.company({ siret: recipientSiret });
  if (companyExists) {
    return;
  }

  return sendMail(
    userMails.contentAwaitsGuest(
      recipientMail,
      recipientName,
      payload.node.recipientCompanyName,
      payload.node.emitterCompanyName
    )
  );
}

async function mailToInexistantEmitter(payload: FormSubscriptionPayload) {
  if (payload.updatedFields && payload.updatedFields.includes("isDeleted")) {
    return;
  }

  const previousEmitterSiret = payload.previousValues
    ? payload.previousValues.emitterCompanySiret
    : null;
  const emitterSiret = payload.node.emitterCompanySiret;
  const emitterMail = payload.node.emitterCompanyMail;
  const emitterName = payload.node.emitterCompanyName || "Monsieur / Madame";

  if (!emitterSiret || !emitterMail || previousEmitterSiret === emitterSiret) {
    return;
  }

  const companyExists = await prisma.$exists.company({ siret: emitterSiret });
  if (companyExists) {
    return;
  }

  return sendMail(
    userMails.contentAwaitsGuest(
      emitterMail,
      emitterName,
      payload.node.emitterCompanyName,
      payload.node.recipientCompanyName
    )
  );
}
