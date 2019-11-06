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
import { pdfEmailAttachment } from "../forms/pdf";
import Dreals from "./dreals";

import axios from "axios";
import { trim } from "../common/strings";

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

/**
 * When form is declined, send mail to emitter, dreal(s) from emitter and recipient
 * The relevant forms is attached
 * Dreal notification can be toggled with NOTIFY_DREAL_WHEN_FORM_DECLINED setting
 * @param payload
 */
export async function mailWhenFormIsDeclined(payload: FormSubscriptionPayload) {
  if (
    !payload.updatedFields ||
    !payload.updatedFields.includes("isAccepted") ||
    !payload.node ||
    payload.node.isAccepted
  ) {
    return;
  }
  const form = await prisma.form({ id: payload.node.id });
  // build pdf as a base64 string
  const { NOTIFY_DREAL_WHEN_FORM_DECLINED } = process.env;

  let attachmentData = await pdfEmailAttachment(payload.node.id);
  const companyAdmins = await getCompanyAdmins(form.emitterCompanySiret);

  // retrieve departments by querying distant api entreprise.data.gouv through td-insee
  // we can not rely on parsing already stored address zip codes because some french cities
  // have a zip code not matching their real department
  const formDepartments = [];
  for (let field of ["emitterCompanySiret", "recipientCompanySiret"]) {
    if (!!form[field]) {
      try {
        let res = await axios.get(
          `http://td-insee:81/siret/${trim(form[field])}`
        );
        if (!!res.data.departement) {
          formDepartments.push(res.data.departement);
        }
      } catch (e) {
        console.error(
          `Error while trying to retrieve data for siret: "${form[field]}"`
        );
      }
    }
  }

  // get recipients from dreals list
  const drealsRecipients = Dreals.filter(d => formDepartments.includes(d.Dept));

  // include drealsRecipients if settings says so
  const recipients =
    NOTIFY_DREAL_WHEN_FORM_DECLINED === "true"
      ? [...companyAdmins, ...drealsRecipients]
      : [...companyAdmins];

  return Promise.all(
    recipients.map(admin => {
      let payload = userMails.formNotAccepted(
        admin.email,
        admin.name,
        form,
        attachmentData
      );
      return sendMail(payload);
    })
  );
}

async function verifiyPresta(payload: FormSubscriptionPayload) {
  if (payload.mutation === "CREATED") {
    const bsd = payload.node;
    const siret = bsd.recipientCompanySiret;
    const wasteCode = bsd.wasteDetailsCode;

    const [company, anomaly] = await verifyPrestataire(siret, wasteCode);

    switch (anomaly) {
      case anomalies.SIRET_UNKNOWN:
        // Raise an internal alert => the siret was not recognized
        const company_ = {
          ...company,
          name: bsd.recipientCompanyName
        };
        createSiretUnknownAlertCard(company_, alertTypes.BSD_CREATION, { bsd });
        break;
      case anomalies.NOT_ICPE_27XX_35XX:
        // Raise an internal alert => a producer is sending a waste
        // to a company that is not ICPE
        createNotICPEAlertCard(company, alertTypes.BSD_CREATION, { bsd });
        break;
      case anomalies.RUBRIQUES_INCOMPATIBLE:
        // Raise an internal alert => a producer is sending a waste
        // to a company that is not compatible with this type of waste
        createNotCompatibleRubriqueAlertCard(
          company,
          alertTypes.BSD_CREATION,
          bsd
        );
    }
  }
}
