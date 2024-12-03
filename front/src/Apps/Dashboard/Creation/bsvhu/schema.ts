import { z } from "zod";

import { BSVHU_WASTE_CODES } from "@td/constants";

const zodCompany = z.object({
  siret: z.string().nullish(),
  name: z.string(),
  contact: z.string().nullish(),
  phone: z.string().nullish(),
  mail: z.string().nullish(),
  address: z.string().nullish(),
  city: z.string().nullish(),
  street: z.string().nullish(),
  postalCode: z.string().nullish()
});

const zodEmitter = z.object({
  company: zodCompany,
  agrementNumber: z.string().nullish(),
  irregularSituation: z.boolean(),
  noSiret: z.boolean()
});

const zodTransporter = z.object({
  company: zodCompany.extend({ vatNumber: z.string().nullish() }),
  transport: z.object({
    takenOverAt: z.coerce
      .date()
      .nullish()
      .transform(v => v?.toISOString())
  }),
  recepisse: z
    .object({
      isExempted: z.boolean().nullish()
    })
    .nullish()
});

const zodDestination = z.object({
  company: zodCompany,
  agrementNumber: z.string().nullish(),
  plannedOperationCode: z.string().nullish(),
  operation: z
    .object({
      code: z.string().nullish(),
      date: z.coerce
        .date()
        .nullish()
        .transform(v => v?.toISOString()),
      nextDestination: z
        .object({
          company: zodCompany
        })
        .nullish(),
      mode: z
        .enum([
          "ELIMINATION",
          "RECYCLAGE",
          "REUTILISATION",
          "VALORISATION_ENERGETIQUE"
        ])
        .nullish()
    })
    .nullish()
    .nullish(),
  reception: z
    .object({
      date: z.coerce
        .date()
        .nullish()
        .transform(v => v?.toISOString()),
      quantity: z.number().nullish(),
      refusalReason: z.string().nullish(),
      weight: z.coerce.number().nonnegative().nullish(),
      identification: z
        .object({
          numbers: z.array(z.string()).nullish(),
          type: z
            .enum([
              "NUMERO_ORDRE_LOTS_SORTANTS",
              "NUMERO_ORDRE_REGISTRE_POLICE"
            ])
            .nullish()
        })
        .nullish(),
      acceptationStatus: z
        .enum(["ACCEPTED", "PARTIALLY_REFUSED", "REFUSED"])
        .nullish()
    })
    .nullish(),
  type: z.enum(["BROYEUR", "DEMOLISSEUR"]).nullish()
});

export const rawBsvhuSchema = z.object({
  customId: z.string().nullish(),
  wasteCode: z.enum(BSVHU_WASTE_CODES).nullish(),
  emitter: zodEmitter,
  transporter: zodTransporter,
  destination: zodDestination,
  packaging: z.enum(["LOT", "UNITE"]).nullish(),
  identification: z.object({
    numbers: z.array(z.string()).nullish(),
    type: z
      .enum(["NUMERO_ORDRE_LOTS_SORTANTS", "NUMERO_ORDRE_REGISTRE_POLICE"])
      .nullish()
  }),
  quantity: z.coerce.number().nonnegative().nullish(),
  weight: z.object({
    isEstimate: z.boolean().nullish(),
    value: z.coerce.number().nonnegative().nullish()
  }),
  ecoOrganisme: z
    .object({
      siret: z.string().nullish(),
      name: z.string().nullish(),
      hasEcoOrganisme: z.boolean().nullish()
    })
    .superRefine((val, ctx) => {
      if (val?.hasEcoOrganisme && !val.siret) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["siret"],
          message: `Veuillez sélectionner un éco-organisme`
        });
      }
    })
});

export type ZodBsvhu = z.infer<typeof rawBsvhuSchema>;
