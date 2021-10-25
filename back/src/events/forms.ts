import { Form } from "@prisma/client";
import axios from "axios";
import prisma from "../prisma";
import { sendMail } from "../mailer/mailing";
import { trim } from "../common/strings";
import { getCompanyAdminUsers } from "../companies/database";
import { searchCompany } from "../companies/sirene";
import { buildPdfBase64 } from "../forms/pdf/generator";
import Dreals from "./dreals";
import { TDEventPayload } from "./emitter";
import { renderMail } from "../mailer/templates/renderers";
import { formNotAccepted, formPartiallyRefused } from "../mailer/templates";

export async function formsEventCallback(payload: TDEventPayload<Form>) {
  await Promise.all([
    mailWhenFormIsDeclined(payload).catch(err =>
      console.error("Error on declined form subscription", err)
    )
  ]);
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
  const mailTemplate = {
    REFUSED: formNotAccepted,
    PARTIALLY_REFUSED: formPartiallyRefused
  }[payload.node.wasteAcceptationStatus];

  const mail = renderMail(mailTemplate, {
    to: recipients,
    cc: ccs,
    variables: { form },
    attachment: attachmentData
  });
  return sendMail(mail);
}
