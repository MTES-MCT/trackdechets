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
import { trim } from "../../common/strings";
import { getOperationModesFromOperationCode } from "../../common/operationModes";

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

// TRA-16750 & TRA-17541: Pour aider les intégrateurs, on auto-complète
// le mode d'opération si un seul est possible, ou si aucun mode ne doit être renseigné
// celà permet aussi de faire passer des révisions qui passent d'un code final à un code non final
// (qui n'attend pas de mode de traitement)
export const fixOperationMode = obj => {
  if (obj.destinationOperationCode) {
    const trimmed = trim(obj.destinationOperationCode);
    const possibleModes = getOperationModesFromOperationCode(trimmed);

    if (possibleModes.length === 1 && !obj.destinationOperationMode) {
      obj.destinationOperationMode = possibleModes[0];
    } else if (!possibleModes.length) {
      obj.destinationOperationMode = null;
    }
  }
  return obj;
};

// TRA-16750: pour aider les intégrateurs, on cast
// le code d'opération "D9" en "D9F" (tolérance)
export const castD9toD9F = obj => {
  if (
    obj.destinationOperationCode &&
    trim(obj.destinationOperationCode) === "D9"
  ) {
    obj.destinationOperationCode = "D 9 F";
  }
  return obj;
};
