import { z } from "zod";

import { BSPAOH_WASTE_CODES, BSPAOH_WASTE_TYPES } from "@td/constants";

const bspaohPackagingSchema = z.object({
  type: z.enum(["LITTLE_BOX", "BIG_BOX", "RELIQUAIRE"]),
  volume: z.coerce.number(),
  containerNumber: z.string(),
  quantity: z.number().positive().lte(1),
  identificationCodes: z.array(z.string()).default([]),
  consistence: z.enum(["SOLIDE", "LIQUIDE"])
});

const zodCompany = z.object({
  siret: z.string(),
  contact: z.string().nullish(),
  phone: z.string().nullish(),
  mail: z.string().nullish(),
  address: z.string().nullish()
});

const zodWaste = z.object({
  type: z.enum(BSPAOH_WASTE_TYPES),
  adr: z.string().nullish(),
  code: z.enum(BSPAOH_WASTE_CODES),
  packagings: z
    .array(bspaohPackagingSchema)
    .default([])
    .transform(val => val ?? [])
});
const zodEmitter = z.object({
  company: zodCompany,

  emission: z.object({
    detail: z.object({
      quantity: z.coerce.number().nullish(),
      weight: z.object({
        value: z.coerce.number().nullish(),

        isEstimate: z.coerce
          .boolean()
          .nullish()
          .transform(v => Boolean(v))
      })
    })
  }),
  customInfo: z.string().nullish()
});
const zodTransporter = z.object({
  company: zodCompany,
  customInfo: z.string().nullish(),
  transport: z.object({
    mode: z.string().nullish(),
    plates: z.preprocess(
      (val: string) => (typeof val === "string" ? val.split(",") : val ?? []),
      z
        .string()
        .array()
        .max(2, { message: "Un maximum de 2 plaques est accepté" })
    )
  })
});
const zodDestination = z.object({
  company: zodCompany,
  cap: z.string().nullish(),
  customInfo: z.string().nullish()
});
export const rawBspaohSchema = z.object({
  waste: zodWaste,
  emitter: zodEmitter,
  transporter: zodTransporter,
  destination: zodDestination
});

export type ZodBspaoh = z.infer<typeof rawBspaohSchema>;
