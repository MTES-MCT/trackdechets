import { getTransporterCompanyOrgId } from "@td/constants";
import { prisma } from "@td/prisma";
import { ZodBsdaTransformer, ZodBsdaTransporterTransformer } from "./types";
import { ParsedZodBsdaTransporter } from "./schema";

export const fillIntermediariesOrgIds: ZodBsdaTransformer = bsda => {
  bsda.intermediariesOrgIds = bsda.intermediaries
    ? bsda.intermediaries
        .flatMap(intermediary => [intermediary.siret, intermediary.vatNumber])
        .filter(Boolean)
    : undefined;

  return bsda;
};

export const fillWasteConsistenceWhenForwarding: ZodBsdaTransformer =
  async bsda => {
    if (
      bsda.type === "RESHIPMENT" &&
      !bsda?.wasteConsistence &&
      !!bsda?.forwarding
    ) {
      const forwarding = await prisma.bsda.findUnique({
        where: { id: bsda.forwarding }
      });
      if (!!forwarding) {
        bsda = { ...bsda, wasteConsistence: forwarding.wasteConsistence };
      }
    }
    return bsda;
  };

async function recipifyTransporter(transporter: ParsedZodBsdaTransporter) {
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
  return transporter;
}

export const updateTransportersRecepisee: ZodBsdaTransformer = async bsda => {
  const transporters = bsda.transporters;
  if (transporters && transporters.length > 0) {
    const recipifedTransporters = await Promise.all(
      transporters.map(t => recipifyTransporter(t))
    );
    return { ...bsda, transporters: recipifedTransporters };
  }
  return bsda;
};

export const updateTransporterRecepisse: ZodBsdaTransporterTransformer =
  async bsdaTransporter => recipifyTransporter(bsdaTransporter);

export const emptyWorkerCertificationWhenWorkerIsDisabled: ZodBsdaTransformer =
  bsda => {
    if (bsda.workerIsDisabled) {
      bsda.workerCertificationHasSubSectionFour = false;
      bsda.workerCertificationHasSubSectionThree = false;
      bsda.workerCertificationCertificationNumber = null;
      bsda.workerCertificationValidityLimit = null;
      bsda.workerCertificationOrganisation = null;
    }

    return bsda;
  };
