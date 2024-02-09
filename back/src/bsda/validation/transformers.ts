import { getTransporterCompanyOrgId } from "@td/constants";
import { prisma } from "@td/prisma";
import { ZodBsdaTransformer } from "./types";

export const fillIntermediariesOrgIds: ZodBsdaTransformer = bsda => {
  bsda.intermediariesOrgIds = bsda.intermediaries
    ? bsda.intermediaries
        .flatMap(intermediary => [intermediary.siret, intermediary.vatNumber])
        .filter(Boolean)
    : undefined;

  return bsda;
};

export const fillTransportersOrgIds: ZodBsdaTransformer = bsda => {
  bsda.transportersOrgIds = [
    bsda.transporterCompanySiret,
    bsda.transporterCompanyVatNumber
  ]
    .filter(Boolean)
    .filter(orgId => orgId.length > 0);

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

export const updateTransporterRecepisee: ZodBsdaTransformer = async bsda => {
  // Évite de modifier les données transporteur après
  // la signature de celui-ci
  if (bsda.transporterTransportSignatureDate) {
    return bsda;
  }

  const orgId = getTransporterCompanyOrgId({
    transporterCompanySiret: bsda.transporterCompanySiret ?? null,
    transporterCompanyVatNumber: bsda.transporterCompanyVatNumber ?? null
  });

  if (!bsda.transporterRecepisseIsExempted && orgId) {
    const transporterReceipt = await prisma.company
      .findUnique({
        where: {
          orgId
        }
      })
      .transporterReceipt();

    bsda.transporterRecepisseNumber = transporterReceipt?.receiptNumber ?? null;
    bsda.transporterRecepisseValidityLimit =
      transporterReceipt?.validityLimit ?? null;
    bsda.transporterRecepisseDepartment =
      transporterReceipt?.department ?? null;
  }

  return bsda;
};

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
