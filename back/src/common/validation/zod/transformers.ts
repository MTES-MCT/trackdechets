import { getTransporterCompanyOrgId } from "@td/constants";
import { prisma } from "@td/prisma";
import {
  ParsedZodBsda,
  ParsedZodBsdaTransporter
} from "../../../bsda/validation/schema";
import {
  ParsedZodBsff,
  ParsedZodBsffTransporter
} from "../../../bsffs/validation/bsff/schema";

export async function recipifyTransporter(
  transporter: ParsedZodBsdaTransporter | ParsedZodBsffTransporter
) {
  // Évite de modifier les données transporteur après
  // la signature de celui-ci
  if (transporter.transporterTransportSignatureDate) {
    return transporter;
  }
  const orgId = getTransporterCompanyOrgId({
    transporterCompanySiret: transporter.transporterCompanySiret ?? null,
    transporterCompanyVatNumber: transporter.transporterCompanyVatNumber ?? null
  });
  if (orgId && !transporter.transporterRecepisseIsExempted) {
    const transporterReceipt = await prisma.company
      .findUnique({
        where: {
          orgId
        }
      })
      .transporterReceipt();

    return {
      ...transporter,
      transporterRecepisseNumber: transporterReceipt?.receiptNumber ?? null,
      transporterRecepisseValidityLimit:
        transporterReceipt?.validityLimit ?? null,
      transporterRecepisseDepartment: transporterReceipt?.department ?? null
    };
  }
  if (transporter.transporterRecepisseIsExempted) {
    return {
      ...transporter,
      transporterRecepisseNumber: null,
      transporterRecepisseValidityLimit: null,
      transporterRecepisseDepartment: null
    };
  }
  return transporter;
}
export async function updateTransportersRecepisse<
  Bsd extends ParsedZodBsda | ParsedZodBsff
>(bsd: Bsd) {
  const transporters = bsd.transporters;
  if (transporters && transporters.length > 0) {
    const recipifedTransporters = await Promise.all(
      transporters.map(t => recipifyTransporter(t))
    );
    return { ...bsd, transporters: recipifedTransporters };
  }
  return bsd;
}
