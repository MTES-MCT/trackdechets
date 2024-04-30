import { z } from "zod";

import { BSPAOH_WASTE_CODES, BSPAOH_WASTE_TYPES } from "@td/constants";

const bspaohPackagingSchema = z.object({
  type: z.enum(["LITTLE_BOX", "BIG_BOX", "RELIQUAIRE"], {
    required_error: "Ce champ est requis",
    invalid_type_error: "Ce champ est requis"
  }),
  volume: z.coerce.number().nullish(),
  containerNumber: z.string().nullish(),
  quantity: z.number().positive().lte(1),
  identificationCodes: z.array(z.string()).nonempty(),
  consistence: z.enum(["SOLIDE", "LIQUIDE"], {
    required_error: "Ce champ est requis",
    invalid_type_error: "Ce champ est requis"
  })
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
  code: z.enum(BSPAOH_WASTE_CODES).nullish(),
  packagings: z
    .array(bspaohPackagingSchema)
    .default([])
    .transform(val => val ?? [])
});

const zodEmitter = z
  .object({
    company: zodCompany,

    emission: z.object({
      detail: z.object({
        quantity: z.coerce.number().nonnegative().nullish(),
        weight: z.object({
          value: z.coerce
            .number()
            .nonnegative()
            .nullish()
            .transform(v => {
              return !v ? null : v;
            }),

          isEstimate: z.boolean().nullish()
        })
      })
    }),
    customInfo: z.string().nullish()
  })
  .superRefine((val, ctx) => {
    if (
      val?.emission?.detail?.weight?.value &&
      val?.emission?.detail?.weight?.isEstimate === null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["emission.detail.weight.isEstimate"],
        message: `Vous devez péciser si le poids est estimé`
      });
    }
    if (
      !val?.emission?.detail?.weight?.value &&
      val?.emission?.detail?.weight?.isEstimate !== null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["emission.detail.weight.value"],
        message: `Vous devez péciser le poids`
      });
    }
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
