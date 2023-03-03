import { z } from "zod";
import { rawBsdaSchema, ZodBsda } from "./schema";

export function someFieldIsNotNullish<Field extends keyof ZodBsda>(
  bsda: ZodBsda,
  fields: readonly Field[]
) {
  return fields.some(field => bsda[field]);
}

export function someFieldIsNullish<Field extends keyof ZodBsda>(
  bsda: ZodBsda,
  fields: readonly Field[]
) {
  return fields.some(field => !bsda[field]);
}
