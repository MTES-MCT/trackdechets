import { Form } from "@prisma/client";
import axios from "axios";
import prisma from "../prisma";
import { sendMail } from "../mailer/mailing";
import { trim } from "../common/strings";
import {
  alertTypes,
  createNotCompatibleRubriqueAlertCard,
  createNotICPEAlertCard,
  createSiretUnknownAlertCard
} from "../common/trello";
import { getCompanyAdminUsers } from "../companies/database";
import { searchCompany } from "../companies/sirene";
import { anomalies, verifyPrestataire } from "../companies/verif";
import { buildPdfBase64 } from "../forms/pdf/generator";
import { userMails } from "../users/mails";
import Dreals from "./dreals";
import { TDEventPayload } from "./emitter";

export async function formsEventCallback(payload: TDEventPayload<Form>) {
  await Promise.all([
    mailToInexistantRecipient(payload).catch(err =>
      console.error("Error on inexistant recipient subscription", err)
    ),
    mailToInexistantEmitter(payload).catch(err =>
      console.error("Error on inexistant emitter subscription", err)
    ),
    mailWhenFormIsDeclined(payload).catch(err =>
      console.error("Error on declined form subscription", err)
    ),
    verifiyPresta(payload).catch(err =>
      console.error("Error on prestataire verification form subscription", err)
    )
  ]);
}

async function mailToInexistantRecipient(payload: TDEventPayload<Form>) {
  if (payload.updatedFields?.hasOwnProperty("isDeleted") || !payload.node) {
    return;
  }

  const previousRecipientSiret = payload.previousNode
    ? payload.previousNode.recipientCompanySiret
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

  const companyExists = await prisma.company.findFirst({
    where: { siret: recipientSiret }
  });
  if (companyExists) {
    return;
  }

  return sendMail(
    userMails.contentAwaitsGuest(
      recipientMail,
      recipientName,
      payload.node.recipientCompanyName,
      payload.node.recipientCompanySiret,
      payload.node.emitterCompanyName
    )
  );
}

async function mailToInexistantEmitter(payload: TDEventPayload<Form>) {
  if (payload.updatedFields?.hasOwnProperty("isDeleted") || !payload.node) {
    return;
  }

  const previousEmitterSiret = payload.previousNode
    ? payload.previousNode.emitterCompanySiret
    : null;
  const emitterSiret = payload.node.emitterCompanySiret;
  const emitterMail = payload.node.emitterCompanyMail;
  const emitterName = payload.node.emitterCompanyName || "Monsieur / Madame";

  if (!emitterSiret || !emitterMail || previousEmitterSiret === emitterSiret) {
    return;
  }

  const companyExists = await prisma.company.findFirst({
    where: { siret: emitterSiret }
  });
  if (companyExists) {
    return;
  }

  return sendMail(
    userMails.contentAwaitsGuest(
      emitterMail,
      emitterName,
      payload.node.emitterCompanyName,
      payload.node.emitterCompanySiret,
      payload.node.recipientCompanyName
    )
  );
}

/**
 * When form is refused or partially refused, send mail to emitter, dreal(s) from emitter and recipient
 * The relevant forms is attached
 * Dreal notification can be toggled with NOTIFY_DREAL_WHEN_FORM_DECLINED setting
 * @param payload
 */
export async function mailWhenFormIsDeclined(payload: TDEventPayload<Form>) {
  if (
    !payload.updatedFields?.hasOwnProperty("wasteAcceptationStatus") ||
    !payload.node ||
    !["REFUSED", "PARTIALLY_REFUSED"].includes(
      payload.node.wasteAcceptationStatus
    )
  ) {
    return;
  }
  const form = await prisma.form.findUnique({ where: { id: payload.node.id } });
  // build pdf as a base64 string
  const { NOTIFY_DREAL_WHEN_FORM_DECLINED } = process.env;

  const attachmentData = {
    file: await buildPdfBase64(form),
    name: `${form.readableId}.pdf`
  };

  const emitterCompanyAdmins = await getCompanyAdminUsers(
    form.emitterCompanySiret
  );
  const recipientCompanyAdmins = await getCompanyAdminUsers(
    form.recipientCompanySiret
  );

  // Retrieve city code by querying distant api entreprise.data.gouv.fr
  // Make a subsequent call to geo.api.gouv.fr to retrive department number
  // from city code
  const formDepartments = [];
  for (const field of ["emitterCompanySiret", "recipientCompanySiret"]) {
    if (!!form[field]) {
      try {
        const company = await searchCompany(trim(form[field]));
        const res = await axios.get(
          `https://geo.api.gouv.fr/communes/${company.codeCommune}`
        );
        if (!!res.data.codeDepartement) {
          formDepartments.push(res.data.codeDepartement);
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
  const recipients = emitterCompanyAdmins.map(admin => ({
    email: admin.email,
    name: admin.name
  }));

  const ccs = [
    ...recipientCompanyAdmins,
    ...(NOTIFY_DREAL_WHEN_FORM_DECLINED === "true" ? drealsRecipients : [])
  ].map(admin => ({ email: admin.email, name: admin.name }));

  // Get formNotAccepted or formPartiallyRefused mail function according to wasteAcceptationStatus value
  const mailFunction = {
    REFUSED: userMails.formNotAccepted,
    PARTIALLY_REFUSED: userMails.formPartiallyRefused
  }[payload.node.wasteAcceptationStatus];

  const mail = mailFunction(recipients, ccs, form, attachmentData);

  return sendMail(mail);
}

async function verifiyPresta(payload: TDEventPayload<Form>) {
  if (payload.mutation === "CREATED") {
    const bsd = payload.node;
    const siret = bsd.recipientCompanySiret;
    const wasteCode = bsd.wasteDetailsCode;

    const [company, anomaly] = await verifyPrestataire(siret, wasteCode);

    switch (anomaly) {
      case anomalies.SIRET_UNKNOWN:
        // Raise an internal alert => the siret was not recognized
        const companyWithName = {
          ...company,
          name: bsd.recipientCompanyName
        };
        createSiretUnknownAlertCard(companyWithName, alertTypes.BSD_CREATION, {
          bsd
        });
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
