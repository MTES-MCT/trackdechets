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
      .transform(v => v?.toISOString()),
    mode: z.string().nullish(),
    plates: z.preprocess(
      (val: string) => (typeof val === "string" ? val.split(",") : val ?? []),
      z
        .string()
        .array()
        .max(2, { message: "Un maximum de 2 plaques est accepté" })
    )
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
              "NUMERO_IMMATRICULATION",
              "NUMERO_FICHE_DROMCOM",
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

export const rawBsvhuSchema = z
  .object({
    customId: z.string().nullish(),
    wasteCode: z.enum(BSVHU_WASTE_CODES).nullish(),
    emitter: zodEmitter,
    transporter: zodTransporter,
    destination: zodDestination,
    packaging: z.enum(["LOT", "UNITE"]).nullish(),
    identification: z.object({
      numbers: z.array(z.string()).nullish(),
      type: z
        .enum([
          "NUMERO_ORDRE_LOTS_SORTANTS",
          "NUMERO_ORDRE_REGISTRE_POLICE",
          "NUMERO_FICHE_DROMCOM",
          "NUMERO_IMMATRICULATION"
        ])
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
      }),
    hasBroker: z.boolean().nullish(),
    broker: z.object({
      company: zodCompany,
      recepisse: z
        .object({
          number: z.string().nullish(),
          department: z.string().nullish(),
          validityLimit: z.string().nullish()
        })
        .nullish()
    }),
    hasTrader: z.boolean().nullish(),
    trader: z.object({
      company: zodCompany,
      recepisse: z
        .object({
          number: z.string().nullish(),
          department: z.string().nullish(),
          validityLimit: z.string().nullish()
        })
        .nullish()
    }),
    hasIntermediaries: z.boolean().nullish(),
    intermediaries: z.array(zodCompany).nullish(),
    containsElectricOrHybridVehicles: z.boolean().nullish()
  })
  .superRefine((val, ctx) => {
    if (val?.hasBroker && !val.broker.company.siret) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hasBroker"],
        message: `Veuillez sélectionner un courtier`
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["broker.company.contact"],
        message: `La personne à contacter chez le courtier est un champ requis.`
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["broker.company.phone"],
        message: `Le N° de téléphone du courtier est un champ requis.`
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["broker.company.mail"],
        message: `L'adresse e-mail du courtier est un champ requis.`
      });
    }

    if (val?.hasTrader && !val.trader.company.siret) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hasTrader"],
        message: `Veuillez sélectionner un négociant`
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["trader.company.contact"],
        message: `La personne à contacter chez le négociant est un champ requis.`
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["trader.company.phone"],
        message: `Le N° de téléphone du négociant est un champ requis.`
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["trader.company.mail"],
        message: `L'adresse e-mail du négociant est un champ requis.`
      });
    }

    if (
      val?.hasIntermediaries &&
      (!val.intermediaries || !val.intermediaries[0].siret)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hasIntermediaries"],
        message: `Veuillez sélectionner au moins un intermédiaire`
      });
    }

    if (val?.hasIntermediaries) {
      val?.intermediaries?.forEach((intermediary, index) => {
        if (!intermediary.siret) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["intermediaries", index, "contact"],
            message: `La personne à contacter chez l'intermédiaire est un champ requis.`
          });
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["intermediaries", index, "phone"],
            message: `Le N° de téléphone de l'intermédiaire est un champ requis.`
          });
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["intermediaries", index, "mail"],
            message: `L'adresse e-mail de l'intermédiaire est un champ requis.`
          });
        }
      });
    }
  });

export type ZodBsvhu = z.infer<typeof rawBsvhuSchema>;
