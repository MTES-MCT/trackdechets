import { prisma } from "@td/prisma";
import {
  BsdaValidationContext,
  ZodBsdaTransformer,
  ZodBsdaTransporterTransformer
} from "./types";
import { recipifyTransporter } from "../../common/validation/zod/transformers";
import { ParsedZodBsda } from "./schema";
import { sirenifyBsda } from "./sirenify";
import { recipifyBsda } from "./recipify";
import { getSealedFields } from "./rules";

export const runTransformers = async (
  bsda: ParsedZodBsda,
  context: BsdaValidationContext
): Promise<ParsedZodBsda> => {
  const transformers = [sirenifyBsda, recipifyBsda, fillWorkerCertification];
  const sealedFields = await getSealedFields(bsda, context);
  for (const transformer of transformers) {
    bsda = await transformer(bsda, sealedFields);
  }
  return bsda;
};

export const fillIntermediariesOrgIds: ZodBsdaTransformer = bsda => {
  bsda.intermediariesOrgIds = bsda.intermediaries
    ? bsda.intermediaries
        .flatMap(intermediary => [intermediary.siret, intermediary.vatNumber])
        .filter(Boolean)
    : undefined;

  return bsda;
};

export const emptyPickupSiteDependingOnType: ZodBsdaTransformer = bsda => {
  if (bsda.type === "GATHERING" || bsda.type === "RESHIPMENT") {
    bsda.emitterPickupSiteName = null;
    bsda.emitterPickupSiteAddress = null;
    bsda.emitterPickupSiteCity = null;
    bsda.emitterPickupSitePostalCode = null;
    bsda.emitterPickupSiteInfos = null;
  }

  return bsda;
};

export const fillWasteConsistenceWhenForwarding: ZodBsdaTransformer =
  async bsda => {
    if (
      bsda.type === "RESHIPMENT" &&
      (!bsda?.wasteConsistence || !bsda?.wasteConsistenceDescription) &&
      !!bsda?.forwarding
    ) {
      const forwarding = await prisma.bsda.findUnique({
        where: { id: bsda.forwarding }
      });
      if (!!forwarding) {
        if (!bsda?.wasteConsistence) {
          bsda = {
            ...bsda,
            wasteConsistence: forwarding.wasteConsistence
          };
        }
        if (!bsda?.wasteConsistenceDescription) {
          bsda = {
            ...bsda,
            wasteConsistenceDescription: forwarding.wasteConsistenceDescription
          };
        }
      }
    }
    return bsda;
  };

export const updateTransporterRecepisse: ZodBsdaTransporterTransformer =
  async bsdaTransporter => recipifyTransporter(bsdaTransporter);

export async function fillWorkerCertification(
  bsda: ParsedZodBsda,
  sealedFields: string[]
): Promise<ParsedZodBsda> {
  if (
    sealedFields.includes("workerCompanySiret") ||
    bsda.workerIsDisabled ||
    !bsda.workerCompanySiret
  ) {
    return bsda;
  }

  const company = await prisma.company.findFirst({
    where: { siret: bsda.workerCompanySiret },
    include: { workerCertification: true }
  });

  const certification = company?.workerCertification;

  if (certification) {
    bsda.workerCertificationHasSubSectionFour = certification.hasSubSectionFour;
    bsda.workerCertificationHasSubSectionThree =
      certification.hasSubSectionThree;
    bsda.workerCertificationCertificationNumber =
      certification.certificationNumber;
    bsda.workerCertificationValidityLimit = certification.validityLimit;
    bsda.workerCertificationOrganisation =
      certification.organisation !== ""
        ? (certification.organisation as any)
        : null;
  }

  return bsda;
}

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
