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
  const transformers = [sirenifyBsda, recipifyBsda];
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
