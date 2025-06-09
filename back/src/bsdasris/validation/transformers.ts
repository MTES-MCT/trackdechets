import { recipifyBsdasri } from "./recipify";
import { getSealedFields } from "./rules";
import { ParsedZodBsdasri } from "./schema";
import { sirenifyBsdasri } from "./sirenify";
import { BsdasriValidationContext, ZodBsdasriTransformer } from "./types";

export const runTransformers = async (
  bsdasri: ParsedZodBsdasri,
  context: BsdasriValidationContext
): Promise<ParsedZodBsdasri> => {
  const transformers = [sirenifyBsdasri, recipifyBsdasri];
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
