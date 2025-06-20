import { Bsda } from "@prisma/client";
import { getCompanyAdminUsers } from "../../companies/database";
import { prisma } from "@td/prisma";
import { buildPdfAsBase64 } from "../pdf/generator";
import { Dreals } from "@td/constants";
import {
  Mail,
  renderMail,
  formNotAccepted,
  formPartiallyRefused
} from "@td/mail";
import { BsdaWithIntermediaries, BsdaWithTransporters } from "../types";
import { getFirstTransporterSync } from "../database";
import { bsdaWasteQuantities } from "../utils";

const { NOTIFY_DREAL_WHEN_FORM_DECLINED } = process.env;

type BsdaForRenderRefusal = Bsda &
  BsdaWithTransporters &
  BsdaWithIntermediaries;

export async function renderBsdaRefusedEmail(
  bsda: BsdaForRenderRefusal,
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

  const transporter = getFirstTransporterSync(bsda);

  const quantities = bsdaWasteQuantities(bsda);

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
        transporterIsExemptedOfReceipt:
          transporter?.transporterRecepisseIsExempted,
        transporterCompanyName: transporter?.transporterCompanyName,
        transporterCompanySiret: transporter?.transporterCompanySiret,
        transporterReceipt: transporter?.transporterRecepisseNumber,
        sentBy: bsda.emitterEmissionSignatureAuthor,
        quantityReceived: bsda.destinationReceptionWeight
          ? bsda.destinationReceptionWeight.dividedBy(1000).toNumber()
          : null,
        quantityRefused: quantities?.quantityRefused
          ? quantities?.quantityRefused.dividedBy(1000).toNumber()
          : null,
        quantityAccepted: quantities?.quantityAccepted
          ? quantities?.quantityAccepted.dividedBy(1000).toNumber()
          : null
      }
    },
    attachment: attachmentData
  });
}
