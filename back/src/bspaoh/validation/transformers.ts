import { ZodFullBspaoh } from "./schema";
import { sirenify } from "./sirenify";
import { recipifyBspaoh } from "./recipify";

/**
 *
 * @param val Runs a bunch function to enrich bspaoh input with computed values
 * @returns
 */
export const runTransformers = async (
  val: ZodFullBspaoh,
  sealedFields: string[] // Transformations should not be run on sealed fields
): Promise<ZodFullBspaoh> => {
  const transformers = [sirenify, recipifyBspaoh];
  for (const transformer of transformers) {
    val = await transformer(val, sealedFields);
  }
  return val;
};
