import { FormSubscriptionPayload, prisma } from "../generated/prisma-client";
import { sendMail } from "../common/mails.helper";
import { userMails } from "../users/mails";
import { getCompanyAdmins } from "../companies/helper";
import { verifyPrestataire, anomalies } from "../companies/verif";
import {
  createSiretUnknownAlertCard,
  createNotICPEAlertCard,
  createNotCompatibleRubriqueAlertCard,
  alertTypes
} from "../common/trello";

export async function formsSubscriptionCallback(
  payload: FormSubscriptionPayload
) {
  mailToInexistantRecipient(payload).catch(err =>
    console.error("Error on inexistant recipient subscription", err)
  );
  mailToInexistantEmitter(payload).catch(err =>
    console.error("Error on inexistant emitter subscription", err)
  );
  mailWhenFormIsDeclined(payload).catch(err =>
    console.error("Error on declined form subscription", err)
  );
  verifiyPresta(payload).catch(err =>
    console.error("Error on prestataire verification form subscription", err)
  );
}

async function mailToInexistantRecipient(payload: FormSubscriptionPayload) {
  if (
    (payload.updatedFields && payload.updatedFields.includes("isDeleted")) ||
    !payload.node
  ) {
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
  if (
    (payload.updatedFields && payload.updatedFields.includes("isDeleted")) ||
    !payload.node
  ) {
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

async function mailWhenFormIsDeclined(payload: FormSubscriptionPayload) {
  if (
    !payload.updatedFields ||
    !payload.updatedFields.includes("isAccepted") ||
    !payload.node ||
    payload.node.isAccepted
  ) {
    return;
  }

  const form = await prisma.form({ id: payload.node.id });
  const companyAdmins = await getCompanyAdmins(form.emitterCompanySiret);

  return Promise.all(
    companyAdmins.map(admin =>
      sendMail(userMails.formNotAccepted(admin.email, admin.name, form))
    )
  );
}


async function verifiyPresta(payload: FormSubscriptionPayload) {

  if (payload.mutation === "CREATED") {

    const bsd = payload.node;
    const siret = bsd.recipientCompanySiret;
    const wasteCode = bsd.wasteDetailsCode;

    const [company, anomaly] = await verifyPrestataire(siret, wasteCode)

    switch(anomaly) {
      case anomalies.SIRET_UNKNOWN:
        // Raise an internal alert => the siret was not recognized
        const company_ = {
          ...company,
          name: bsd.recipientCompanyName
        };
        createSiretUnknownAlertCard(company_, alertTypes.BSD_CREATION, {bsd});
        break;
      case anomalies.NOT_ICPE_27XX_35XX:
        // Raise an internal alert => a producer is sending a waste
        // to a company that is not ICPE
        createNotICPEAlertCard(company, alertTypes.BSD_CREATION, {bsd});
        break;
      case anomalies.RUBRIQUES_INCOMPATIBLE:
        // Raise an internal alert => a producer is sending a waste
        // to a company that is not compatible with this type of waste
        createNotCompatibleRubriqueAlertCard(company, alertTypes.BSD_CREATION, bsd);
    }
  }
}


