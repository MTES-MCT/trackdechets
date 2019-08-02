import axios from "axios";
import { FormSubscriptionPayload, prisma } from "../generated/prisma-client";
import { sendMail } from "../common/mails.helper";
import { userMails } from "../users/mails";
import { getCompanyAdmins } from "../companies/helper";
import { checkIsCompatible, notICPEAlert, rubriqueNotCompatibleAlert } from "../companies/verif";


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
  verifiyPrestataire(payload).catch(err =>
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


async function verifiyPrestataire(payload: FormSubscriptionPayload) {

  if (payload.mutation === "CREATED") {

    // raise alert in production only
    if (process.env.NODE_ENV === "production") {

      const bsd = payload.node;
      const siret = bsd.recipientCompanySiret;
      const wasteCode = bsd.wasteDetailsCode;

      // retrieves company information from insee and the
      // consolidated database
      const response = await axios.get(`http://td-insee:81/siret/${siret}`);
      const company = response.data;

      if (!company.codeS3ic) {
        // the company is not an ICPE (installation classée pour
        // la protection de l'environnement) => raise an alert
        return notICPEAlert(company, bsd);
      }

      // company is an ICPE, check if its rubriques are compatible
      // with the wasteCode
      const isCompatible = checkIsCompatible(company, wasteCode);
      if (!isCompatible) {
        // raise an alert if not compatible
        return rubriqueNotCompatibleAlert(company, bsd);
      }
    }
  }
}


