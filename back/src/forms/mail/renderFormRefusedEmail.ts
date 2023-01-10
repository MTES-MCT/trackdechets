import { Form } from "@prisma/client";
import prisma from "../../prisma";
import { getCompanyAdminUsers } from "../../companies/database";
import { Mail } from "../../mailer/types";
import { generateBsddPdfToBase64 } from "../pdf";
import DREALS from "../../common/constants/DREALS";
import { formNotAccepted, formPartiallyRefused } from "../../mailer/templates";
import { renderMail } from "../../mailer/templates/renderers";
import { getTransporterCompanyOrgId } from "../../common/constants/companySearchHelpers";

const { NOTIFY_DREAL_WHEN_FORM_DECLINED } = process.env;

export async function renderFormRefusedEmail(
  form: Form,
  notifyDreal = NOTIFY_DREAL_WHEN_FORM_DECLINED === "true"
): Promise<Mail> {
  if (form.emitterIsPrivateIndividual || form.emitterIsForeignShip) {
    return;
  }

  const forwardedIn = form.forwardedInId
    ? await prisma.form.findUnique({ where: { id: form.id } }).forwardedIn()
    : null;

  const isFinalDestinationRefusal = forwardedIn && !!forwardedIn.sentAt;

  const destinationSiret = isFinalDestinationRefusal
    ? forwardedIn.recipientCompanySiret
    : form.recipientCompanySiret;

  const wasteAcceptationStatus = isFinalDestinationRefusal
    ? forwardedIn.wasteAcceptationStatus
    : form.wasteAcceptationStatus;

  const attachmentData = {
    file: await generateBsddPdfToBase64(form),
    name: `${form.readableId}.pdf`
  };

  const emitterCompanyAdmins = await getCompanyAdminUsers(
    form.emitterCompanySiret
  );
  const destinationCompanyAdmins = await getCompanyAdminUsers(destinationSiret);
  const tempStorerCompanyAdmins = isFinalDestinationRefusal
    ? await getCompanyAdminUsers(form.recipientCompanySiret)
    : [];

  let drealsRecipients = [];

  if (notifyDreal) {
    const companies = await prisma.company.findMany({
      where: {
        siret: {
          in: [form.emitterCompanySiret, destinationSiret]
        }
      },
      select: { codeDepartement: true }
    });
    const formDepartments = companies.map(c => c.codeDepartement);
    // get recipients from dreals list
    drealsRecipients = DREALS.filter(d => formDepartments.includes(d.Dept));
  }

  const to = emitterCompanyAdmins.map(admin => ({
    email: admin.email,
    name: admin.name
  }));

  // include drealsRecipients if settings says so
  const cc = [
    ...destinationCompanyAdmins,
    ...tempStorerCompanyAdmins,
    ...(notifyDreal ? drealsRecipients : [])
  ].map(admin => ({ email: admin.email, name: admin.name }));

  // Get formNotAccepted or formPartiallyRefused mail function according to wasteAcceptationStatus value
  const mailTemplate = {
    REFUSED: formNotAccepted,
    PARTIALLY_REFUSED: formPartiallyRefused
  }[wasteAcceptationStatus];

  return renderMail(mailTemplate, {
    to,
    cc,
    variables: {
      form: {
        readableId: form.readableId,
        wasteDetailsName: form.wasteDetailsName,
        wasteDetailsCode: form.wasteDetailsCode,
        emitterCompanyName: form.emitterCompanyName,
        emitterCompanySiret: form.emitterCompanySiret,
        emitterCompanyAddress: form.emitterCompanyAddress,
        ...(isFinalDestinationRefusal
          ? {
              receivedAt: forwardedIn.receivedAt,
              recipientCompanyName: forwardedIn.recipientCompanyName,
              recipientCompanySiret: forwardedIn.recipientCompanySiret,
              wasteRefusalReason: forwardedIn.wasteRefusalReason,
              transporterIsExemptedOfReceipt:
                forwardedIn.transporterIsExemptedOfReceipt,
              transporterCompanyName: forwardedIn.transporterCompanyName,
              transporterCompanySiret: getTransporterCompanyOrgId(forwardedIn),
              transporterReceipt: forwardedIn.transporterReceipt,
              sentBy: forwardedIn.sentBy,
              quantityReceived: forwardedIn.quantityReceived
            }
          : {
              receivedAt: form.receivedAt,
              recipientCompanyName: form.recipientCompanyName,
              recipientCompanySiret: form.recipientCompanySiret,
              wasteRefusalReason: form.wasteRefusalReason,
              transporterIsExemptedOfReceipt:
                form.transporterIsExemptedOfReceipt,
              transporterCompanyName: form.transporterCompanyName,
              transporterCompanySiret: getTransporterCompanyOrgId(form),
              transporterReceipt: form.transporterReceipt,
              sentBy: form.sentBy,
              quantityReceived: form.quantityReceived
            })
      }
    },
    attachment: attachmentData
  });
}
