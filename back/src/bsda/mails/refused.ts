import { Bsda } from "@prisma/client";
import { getCompanyAdminUsers } from "../../companies/database";
import prisma from "../../prisma";
import { buildPdfAsBase64 } from "../pdf/generator";
import { Dreals } from "shared/constants";
import {
  Mail,
  renderMail,
  formNotAccepted,
  formPartiallyRefused
} from "@td/mail";
import { Decimal } from "decimal.js-light";

const { NOTIFY_DREAL_WHEN_FORM_DECLINED } = process.env;

export async function renderBsdaRefusedEmail(
  bsda: Bsda,
  notifyDreal = NOTIFY_DREAL_WHEN_FORM_DECLINED === "true"
): Promise<Mail | undefined> {
  const attachmentData = {
    file: await buildPdfAsBase64(bsda),
    name: `${bsda.id}.pdf`
  };

  const emitterCompanyAdmins = bsda.emitterCompanySiret
    ? await getCompanyAdminUsers(bsda.emitterCompanySiret)
    : [];
  const destinationCompanyAdmins = await getCompanyAdminUsers(
    bsda.destinationCompanySiret!
  );

  let drealsRecipients: typeof Dreals = [];

  if (notifyDreal) {
    const companies = await prisma.company.findMany({
      where: {
        siret: {
          in: [bsda.emitterCompanySiret, bsda.destinationCompanySiret].filter(
            Boolean
          )
        }
      },
      select: { codeDepartement: true }
    });
    const formDepartments = companies.map(c => c.codeDepartement);
    // get recipients from dreals list
    drealsRecipients = Dreals.filter(d => formDepartments.includes(d.Dept));
  }

  const to = bsda.emitterIsPrivateIndividual
    ? [
        {
          email: bsda.emitterCompanyMail!, // requis dans le contexte d'appel de la fonction
          name: bsda.emitterCompanyName! // requis par le schéma Zod
        }
      ]
    : emitterCompanyAdmins.map(admin => ({
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
