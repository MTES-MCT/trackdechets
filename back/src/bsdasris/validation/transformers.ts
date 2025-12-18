import { OperationMode } from "@td/prisma";
import { trim } from "../../common/strings";
import { recipifyBsdasri } from "./recipify";
import { getSealedFields } from "./rules";
import { ParsedZodBsdasri } from "./schema";
import { sirenifyBsdasri } from "./sirenify";
import { BsdasriValidationContext, ZodBsdasriTransformer } from "./types";

export const runTransformers = async (
  bsdasri: ParsedZodBsdasri,
  context: BsdasriValidationContext
): Promise<ParsedZodBsdasri> => {
  const transformers = [
    sirenifyBsdasri,
    recipifyBsdasri,

    emptyRecepisseWhenNoActor
  ];
  const sealedFields = await getSealedFields(bsdasri, context);

  for (const transformer of transformers) {
    bsdasri = await transformer(bsdasri, sealedFields);
  }

  return bsdasri;
};

export const fillIntermediariesOrgIds: ZodBsdasriTransformer = bsdasri => {
  bsdasri.intermediariesOrgIds = bsdasri.intermediaries
    ? bsdasri.intermediaries
        .flatMap(intermediary => [intermediary.siret, intermediary.vatNumber])
        .filter(Boolean)
    : undefined;

  return bsdasri;
};

export const emptyRecepisseWhenNoActor = (
  bsdasri: ParsedZodBsdasri,
  sealedFields: string[]
) => {
  // void recepisse if trader/broker are null
  if (
    !bsdasri.brokerCompanySiret &&
    !sealedFields.includes("brokerCompanySiret")
  ) {
    bsdasri.brokerRecepisseNumber = null;
    bsdasri.brokerRecepisseDepartment = null;
    bsdasri.brokerRecepisseValidityLimit = null;
  }
  if (
    !bsdasri.traderCompanySiret &&
    !sealedFields.includes("brokerCompanySiret")
  ) {
    bsdasri.traderRecepisseNumber = null;
    bsdasri.traderRecepisseDepartment = null;
    bsdasri.traderRecepisseValidityLimit = null;
  }

  return bsdasri;
};
