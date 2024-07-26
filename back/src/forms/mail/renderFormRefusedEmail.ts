import { BsddTransporter, Form } from "@prisma/client";
import { prisma } from "@td/prisma";
import { getCompanyAdminUsers } from "../../companies/database";
import { generateBsddPdfToBase64 } from "../pdf";
import {
  Mail,
  renderMail,
  formNotAccepted,
  formPartiallyRefused
} from "@td/mail";
import { getTransporterCompanyOrgId, Dreals } from "@td/constants";
import { getFirstTransporter } from "../database";
import { bsddWasteQuantities } from "../helpers/bsddWasteQuantities";

const { NOTIFY_DREAL_WHEN_FORM_DECLINED } = process.env;

export async function renderFormRefusedEmail(
  form: Form,
  notifyDreal = NOTIFY_DREAL_WHEN_FORM_DECLINED === "true"
): Promise<Mail | undefined> {
  if (form.emitterIsPrivateIndividual || form.emitterIsForeignShip) {
    return;
  }

  const forwardedIn = form.forwardedInId
    ? await prisma.form.findUnique({ where: { id: form.id } }).forwardedIn()
    : null;

  const isFinalDestinationRefusal = forwardedIn && !!forwardedIn.sentAt;

  const destinationSiret = isFinalDestinationRefusal
    ? forwardedIn.recipientCompanySiret!
    : form.recipientCompanySiret!;

  const wasteAcceptationStatus = isFinalDestinationRefusal
    ? forwardedIn.wasteAcceptationStatus!
    : form.wasteAcceptationStatus!;

  const { filename, data } = await generateBsddPdfToBase64(form);
  const attachmentData = {
    file: data,
    name: `${filename}.pdf`
  };

  const emitterCompanyAdmins = await getCompanyAdminUsers(
    form.emitterCompanySiret!
  );
  const destinationCompanyAdmins = await getCompanyAdminUsers(destinationSiret);
  const tempStorerCompanyAdmins = isFinalDestinationRefusal
    ? await getCompanyAdminUsers(form.recipientCompanySiret!)
    : [];

  let drealsRecipients: typeof Dreals = [];

  if (notifyDreal) {
    const companies = await prisma.company.findMany({
      where: {
        siret: {
          in: [form.emitterCompanySiret!, destinationSiret]
        }
      },
      select: { codeDepartement: true }
    });
    const formDepartments = companies.map(c => c.codeDepartement);
    // get recipients from dreals list
    drealsRecipients = Dreals.filter(d => formDepartments.includes(d.Dept));
  }

  const to = emitterCompanyAdmins.map(admin => ({
    email: admin.email,
    name: admin.name ?? ""
  }));

  // include drealsRecipients if settings says so
  const cc = [
    ...destinationCompanyAdmins,
    ...tempStorerCompanyAdmins,
    ...(notifyDreal ? drealsRecipients : [])
  ].map(admin => ({ email: admin.email, name: admin.name ?? "" }));

  // Get formNotAccepted or formPartiallyRefused mail function according to wasteAcceptationStatus value
  console.log("wasteAcceptationStatus", wasteAcceptationStatus);
  const mailTemplate = {
    REFUSED: formNotAccepted,
    PARTIALLY_REFUSED: formPartiallyRefused
  }[wasteAcceptationStatus];

  const transporter = await getFirstTransporter(form);
  let forwardedInTransporter: BsddTransporter | null = null;
  if (forwardedIn) {
    forwardedInTransporter = await getFirstTransporter(forwardedIn);
  }

  const wasteQuantities = bsddWasteQuantities(form);

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
        quantityAccepted: wasteQuantities?.quantityAccepted,
        quantityRefused: wasteQuantities?.quantityRefused,
        ...(isFinalDestinationRefusal
          ? {
              signedAt: forwardedIn.signedAt,
              recipientCompanyName: forwardedIn.recipientCompanyName,
              recipientCompanySiret: forwardedIn.recipientCompanySiret,
              wasteRefusalReason: forwardedIn.wasteRefusalReason,
              transporterIsExemptedOfReceipt:
                forwardedInTransporter?.transporterIsExemptedOfReceipt,
              transporterCompanyName:
                forwardedInTransporter?.transporterCompanyName,
              transporterCompanySiret: getTransporterCompanyOrgId(
                forwardedInTransporter
              ),
              transporterReceipt: forwardedInTransporter?.transporterReceipt,
              sentBy: forwardedIn.sentBy,
              quantityReceived: forwardedIn.quantityReceived?.toDecimalPlaces(6)
            }
          : {
              signedAt: form.signedAt,
              recipientCompanyName: form.recipientCompanyName,
              recipientCompanySiret: form.recipientCompanySiret,
              wasteRefusalReason: form.wasteRefusalReason,
              transporterIsExemptedOfReceipt:
                transporter?.transporterIsExemptedOfReceipt,
              transporterCompanyName: transporter?.transporterCompanyName,
              transporterCompanySiret: getTransporterCompanyOrgId(transporter),
              transporterReceipt: transporter?.transporterReceipt,
              sentBy: form.sentBy,
              quantityReceived: form.quantityReceived?.toDecimalPlaces(6)
            })
      }
    },
    attachment: attachmentData
  });
}
