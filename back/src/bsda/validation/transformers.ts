import prisma from "../../prisma";
import { ZodBsda } from "./schema";

/**
 *
 * @param val Runs a bunch (currently one) function to enrich bsda input with computed values
 * @returns
 */
export const runTransformers = async (val: ZodBsda): Promise<ZodBsda> => {
  const transformers = [reshipmentBsdaTransformer];
  for (const transformer of transformers) {
    val = await transformer(val);
  }
  return val;
};

const reshipmentBsdaTransformer = async (val: ZodBsda): Promise<ZodBsda> => {
  if (
    val.type === "RESHIPMENT" &&
    !val?.wasteConsistence &&
    !!val?.forwarding
  ) {
    const forwarding = await prisma.bsda.findUnique({
      where: { id: val.forwarding }
    });
    if (!!forwarding) {
      val = { ...val, wasteConsistence: forwarding.wasteConsistence };
    }
  }
  return val;
};
