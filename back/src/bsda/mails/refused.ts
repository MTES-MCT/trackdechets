import { Mail } from "../../mailer/types";
import { Bsda } from "@prisma/client";
import { getCompanyAdminUsers } from "../../companies/database";
import prisma from "../../prisma";
import { buildPdfAsBase64 } from "../pdf/generator";
import DREALS from "../../common/constants/DREALS";
import { formNotAccepted, formPartiallyRefused } from "../../mailer/templates";
import { renderMail } from "../../mailer/templates/renderers";
import Decimal from "decimal.js-light";

const { NOTIFY_DREAL_WHEN_FORM_DECLINED } = process.env;

export async function renderBsdaRefusedEmail(
  bsda: Bsda,
  notifyDreal = NOTIFY_DREAL_WHEN_FORM_DECLINED === "true"
): Promise<Mail | undefined> {
  const attachmentData = {
    file: await buildPdfAsBase64(bsda),
    name: `${bsda.id}.pdf`
  };

  const emitterCompanyAdmins = await getCompanyAdminUsers(
    bsda.emitterCompanySiret!
  );
  const destinationCompanyAdmins = await getCompanyAdminUsers(
    bsda.destinationCompanySiret!
  );

  let drealsRecipients: typeof DREALS = [];

  if (notifyDreal) {
    const companies = await prisma.company.findMany({
      where: {
        siret: {
          in: [bsda.emitterCompanySiret!, bsda.emitterCompanySiret!]
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
    name: admin.name ?? ""
  }));

  // include drealsRecipients if settings says so
  const cc = [
    ...destinationCompanyAdmins,
    ...(notifyDreal ? drealsRecipients : [])
  ].map(admin => ({ email: admin.email, name: admin.name ?? "" }));

  // Get formNotAccepted or formPartiallyRefused mail function according to wasteAcceptationStatus value
  const mailTemplate = {
    REFUSED: formNotAccepted,
    PARTIALLY_REFUSED: formPartiallyRefused
  }[bsda.destinationReceptionAcceptationStatus!];

  return renderMail(mailTemplate, {
    to,
    cc,
    variables: {
      form: {
        readableId: bsda.id,
        wasteDetailsName: bsda.wasteMaterialName,
        wasteDetailsCode: bsda.wasteCode,
        emitterCompanyName: bsda.emitterCompanyName,
        emitterCompanySiret: bsda.emitterCompanySiret,
        emitterCompanyAddress: bsda.emitterCompanyAddress,
        signedAt: bsda.destinationReceptionDate,
        recipientCompanyName: bsda.destinationCompanyName,
        recipientCompanySiret: bsda.destinationCompanySiret,
        wasteRefusalReason: bsda.destinationReceptionRefusalReason,
        transporterIsExemptedOfReceipt: bsda.transporterRecepisseIsExempted,
        transporterCompanyName: bsda.transporterCompanyName,
        transporterCompanySiret: bsda.transporterCompanySiret,
        transporterReceipt: bsda.transporterRecepisseNumber,
        sentBy: bsda.emitterEmissionSignatureAuthor,
        quantityReceived: bsda.destinationReceptionWeight
          ? new Decimal(bsda.destinationReceptionWeight)
              .dividedBy(1000)
              .toNumber()
          : bsda.destinationReceptionWeight
      }
    },
    attachment: attachmentData
  });
}
