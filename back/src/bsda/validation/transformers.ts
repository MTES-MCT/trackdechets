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
import { OperationMode } from "@prisma/client";
import { trim } from "../../common/strings";

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
    bsda.workerCertificationOrganisation = certification.organisation as any;
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

// TRA-16750: pour aider les intégrateurs, on auto-complète
// le mode d'opération à "Élimination" si l'opération est
// "D 9 F" et que le mode n'est pas fourni.
export const fixOperationModeForD9F = obj => {
  if (
    obj.destinationOperationCode &&
    trim(obj.destinationOperationCode) === "D9F"
  ) {
    if (!obj.destinationOperationMode) {
      obj.destinationOperationMode = OperationMode.ELIMINATION;
    }
  }
  return obj;
};
