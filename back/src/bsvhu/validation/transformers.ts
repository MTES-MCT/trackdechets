import { recipifyBsvhu } from "./recipify";
import { getSealedFields } from "./rules";
import { ParsedZodBsvhu } from "./schema";
import { sirenifyBsvhu } from "./sirenify";
import { BsvhuValidationContext, ZodBsvhuTransformer } from "./types";

export const runTransformers = async (
  bsvhu: ParsedZodBsvhu,
  context: BsvhuValidationContext
): Promise<ParsedZodBsvhu> => {
  const transformers = [sirenifyBsvhu, recipifyBsvhu];
  const sealedFields = await getSealedFields(bsvhu, context);

  for (const transformer of transformers) {
    bsvhu = await transformer(bsvhu, sealedFields);
  }
  return bsvhu;
};

export const fillIntermediariesOrgIds: ZodBsvhuTransformer = bsvhu => {
  bsvhu.intermediariesOrgIds = bsvhu.intermediaries
    ? bsvhu.intermediaries
        .flatMap(intermediary => [intermediary.siret, intermediary.vatNumber])
        .filter(Boolean)
    : undefined;

  return bsvhu;
};
