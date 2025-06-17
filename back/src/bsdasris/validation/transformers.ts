import { recipifyBsdasri } from "./recipify";
import { getSealedFields } from "./rules";
import { ParsedZodBsdasri } from "./schema";
import { sirenifyBsdasri } from "./sirenify";
import { BsdasriValidationContext } from "./types";

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
