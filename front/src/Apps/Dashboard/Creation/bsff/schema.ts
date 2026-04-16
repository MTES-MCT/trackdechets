import { z } from "zod";
import { BSFF_WASTE_CODES } from "@td/constants";

const BSFF_OPERATION_CODES = [
  "R1",
  "R2",
  "R3",
  "R5",
  "R12",
  "R13",
  "D10",
  "D13",
  "D14",
  "D15"
] as const;

const TransportMode = {
  ROAD: "ROAD",
  RAIL: "RAIL",
  AIR: "AIR",
  RIVER: "RIVER",
  SEA: "SEA",
  OTHER: "OTHER",
  UNKNOWN: "UNKNOWN"
} as const;

const BsffPackagingType = {
  BOUTEILLE: "BOUTEILLE",
  CONTENEUR: "CONTENEUR",
  CITERNE: "CITERNE",
  AUTRE: "AUTRE"
} as const;

const BsffType = {
  TRACER_FLUIDE: "TRACER_FLUIDE",
  COLLECTE_PETITES_QUANTITES: "COLLECTE_PETITES_QUANTITES",
  GROUPEMENT: "GROUPEMENT",
  RECONDITIONNEMENT: "RECONDITIONNEMENT",
  REEXPEDITION: "REEXPEDITION"
} as const;

const ZodBsffPackagingEnum = z.enum([
  "BOUTEILLE",
  "CONTENEUR",
  "CITERNE",
  "AUTRE",
  ""
]);

const zodCompany = z
  .object({
    siret: z.string().nullish(),
    orgId: z.string().nullish(),
    vatNumber: z.string().nullish(),
    name: z.string().nullish(),
    contact: z.string().nullish(),
    phone: z.string().nullish(),
    mail: z.string().nullish(),
    address: z.string().nullish()
  })
  .nullish();

const zodSignature = z
  .object({
    author: z.string().nullish(),
    date: z.coerce.date().nullish()
  })
  .nullish();

export const ZodWasteCodeEnum = z
  .enum(BSFF_WASTE_CODES, {
    errorMap: (issue, ctx) => {
      if (issue.code === z.ZodIssueCode.invalid_enum_value) {
        return {
          message:
            `Le code déchet ne fait pas partie de la` +
            ` liste reconnue : ${BSFF_WASTE_CODES.join(", ")}`
        };
      }
      return { message: ctx.defaultError };
    }
  })
  .nullish();

export type ZodWasteCodeEnum = z.infer<typeof ZodWasteCodeEnum>;

export const ZodOperationEnum = z
  .enum(BSFF_OPERATION_CODES, {
    errorMap: (issue, ctx) => {
      if (issue.code === z.ZodIssueCode.invalid_enum_value) {
        return {
          message:
            "Le code de l'opération de traitement ne fait pas" +
            ` partie de la liste reconnue : ${BSFF_OPERATION_CODES.join(", ")}`
        };
      }
      return { message: ctx.defaultError };
    }
  })
  .nullish();

const rawBsffPackagingSchema = z.object({
  type: z.nativeEnum(BsffPackagingType),
  other: z.string().max(250).nullish(),
  volume: z.number().nonnegative().nullish(),
  weight: z.coerce.number().nonnegative().nullish(),
  numero: z
    .string({
      required_error: "Conditionnements : le numéro d'identification est requis"
    })
    .max(250)
    .min(1, "Conditionnements : le numéro d'identification est requis")
});

const bsffPackagingSchema = z
  .object({
    // type: ZodBsffPackagingEnum.nullish().transform(val =>
    // val === "" ? null : val
    // ),
    type: z.nativeEnum(BsffPackagingType),
    other: z.string().max(250).nullish(),
    quantity: z.coerce.number().nonnegative().nullish(),
    volume: z.coerce
      .number({
        required_error: "Conditionnements : le volume doit être supérieure à 0"
      })
      .positive("Conditionnements : le volume doit être supérieur à 0")
      .max(250),
    weight: z.coerce
      .number({
        required_error: "Conditionnements : le poids doit être supérieur à 0"
      })
      .positive("Conditionnements : le poids doit être supérieur à 0")
      .max(250),
    numero: z
      .string({
        required_error:
          "Conditionnements : le numéro d'identification est requis"
      })
      .max(250)
      .min(1, "Conditionnements : le numéro d'identification est requis")
  })
  .refine(val => val.type !== "AUTRE" || !!val.other, {
    path: ["other"],
    message:
      "Vous devez saisir la description du conditionnement quand le type de conditionnement est 'Autre'"
  });

const bsffGroupingOrForwardingSchema = z.object({
  id: z.string(),
  bsffId: z.string().nullish(),
  numero: z.string().nullish(),
  type: z.nativeEnum(BsffPackagingType),
  other: z.string().nullish(),
  volume: z.number().nonnegative().nullish(),
  acceptation: z
    .object({
      wasteCode: z.string().nullish(),
      wasteDescription: z.string().nullish(),
      weight: z.coerce.number().nonnegative().nullish()
    })
    .nullish(),
  waste: z
    .object({
      code: z.string().nullish(),
      adr: z.string().nullish(),
      weightValue: z.coerce.number().nonnegative().nullish(),
      description: z.string().max(250).nullish()
    })
    .nullish(),
  plannedOperationCode: ZodOperationEnum,
  bsff: z.object({
    emitter: z
      .object({
        company: zodCompany.nullish()
      })
      .nullish()
  }),
  /*destination: z
    .object({
      company: zodCompany.nullish(),
       customInfo: z.string().max(250).nullish(),
      cap: z.string().max(250).nullish(),
      reception: z
        .object({
        date: z.coerce.date().nullish(),
        signature: zodSignature
        })
        .nullish(),
       plannedOperationCode: ZodOperationEnum
    })
    .nullish(),*/
  packagings: z.array(bsffPackagingSchema).nullish(),
  nextBsff: z
    .object({
      emitter: z
        .object({
          company: zodCompany.nullish()
        })
        .nullish()
    })
    .nullish()
});
// const ficheInterventionSchema = z.object({
//   id: z.string().nullish(), // ← ajouter ceci
//   numero: z.string({
//     required_error: "Numéro de fiche d'intervention requis"
//   }).min(1, "Le numéro ne peut pas être vide"),

//   weight: z.preprocess(
//     val => val === "" ? null : val,
//     z.coerce.number({
//       required_error: "Le poids est requis"
//     }).positive("Le poids doit être supérieur à 0")
//   ),

//   postalCode: z.string({
//     required_error: "Code postal requis"
//   }).min(1, "Le code postal ne peut pas être vide"),

//   detenteur: z.object({
//     isPrivateIndividual: z.boolean().optional(),
//     company: zodCompany
//   }, {
//     required_error: "Détenteur requis"
//   }),
//     operateur: z.string().nullish(),
// });

export const rawBsffSchema = z.object({
  id: z.string().nullish(),
  type: z
    .nativeEnum(BsffType)
    .nullish()
    .transform(t => t ?? BsffType.COLLECTE_PETITES_QUANTITES),
  emitter: z
    .object({
      company: zodCompany,
      customInfo: z.string().max(250).nullish(),
      emission: zodSignature
    })
    .nullish(),
  waste: z
    .object({
      code: ZodWasteCodeEnum,
      adr: z.string().max(750).nullish(),
      description: z.string().max(250).nullish()
    })
    .nullish(),
  weight: z
    .object({
      value: z.coerce.number().nonnegative().nullish(),
      isEstimate: z.boolean().nullish()
    })
    .nullish(),

  destination: z
    .object({
      company: zodCompany,
      customInfo: z.string().max(250).nullish(),
      cap: z.string().max(250).nullish(),
      reception: z.object({
        date: z.coerce.date().nullish(),
        signature: zodSignature
      }),
      plannedOperationCode: ZodOperationEnum
    })
    .nullish(),
  detenteurCompanySirets: z.array(z.string().max(250)).optional().nullish(),
  transporters: z
    .array(
      z
        .object({
          id: z.string().nullish(),
          number: z.coerce.number().nonnegative().nullish(),
          company: zodCompany,
          customInfo: z.string().nullish(),
          recepisse: z.object({
            isExempted: z.boolean().nullish(),
            number: z.string().nullish(),
            department: z.string().nullish(),
            validityLimit: z.coerce.date().nullish()
          }),
          transport: z.object({
            mode: z.nativeEnum(TransportMode).nullish(),
            plates: z.array(z.string()),
            takenOverAt: z.coerce.date().nullish(),
            signature: zodSignature
          })
        })
        .nullish()
    )
    .max(5, "Vous ne pouvez pas ajouter plus de 5 transporteurs")
    .optional(),
  packagings: z.array(bsffPackagingSchema).nullish(),
  // ficheInterventions: z.array(ficheInterventionSchema).optional().nullish(),
  repackaging: z.array(z.string().max(250)).nullish(),
  grouping: z.array(bsffGroupingOrForwardingSchema).optional().nullish(),
  forwarding: bsffGroupingOrForwardingSchema.nullish()
});

type ZodBsffPackagingEnum = z.infer<typeof ZodBsffPackagingEnum>;

export type ZodBsff = z.infer<typeof rawBsffSchema>;

export type ZodBsffGroupingOrForwarding = z.infer<
  typeof bsffGroupingOrForwardingSchema
>;
