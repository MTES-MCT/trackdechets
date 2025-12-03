import {
  BsdaConsistence,
  BsdaType,
  OperationMode,
  TransportMode,
  WasteAcceptationStatus
} from "@td/codegen-ui";
import { BSDA_WASTE_CODES } from "@td/constants";
import { z } from "zod";

const zodCompany = z
  .object({
    siret: z.string().nullish(),
    name: z.string().nullish(),
    contact: z.string().nullish(),
    phone: z.string().nullish(),
    mail: z.string().nullish(),
    address: z.string().nullish(),
    city: z.string().nullish(),
    street: z.string().nullish(),
    postalCode: z.string().nullish()
  })
  .nullish();

const zodSignature = z
  .object({
    author: z.string().nullish(),
    date: z.coerce.date().nullish()
  })
  .nullish();

const ZodBsdaPackagingEnum = z.enum([
  "BIG_BAG",
  "CONTENEUR_BAG",
  "DEPOT_BAG",
  "OTHER",
  "PALETTE_FILME",
  "SAC_RENFORCE"
]);

type ZodBsdaPackagingEnum = z.infer<typeof ZodBsdaPackagingEnum>;

const ZodWasteCodeEnum = z.enum(BSDA_WASTE_CODES).nullish();

export type ZodWasteCodeEnum = z.infer<typeof ZodWasteCodeEnum>;

const PARTIAL_OPERATIONS = ["R 13", "D 15"] as const;
const OPERATIONS = ["R 5", "D 5", "D 9", "", ...PARTIAL_OPERATIONS] as const;
const ZodOperationEnum = z
  .enum(OPERATIONS)
  .nullish()
  .transform(val => (val === "" ? null : val));

type ZodOperationEnum = z.infer<typeof ZodOperationEnum>;

const bsdaPackagingSchema = z
  .object({
    type: ZodBsdaPackagingEnum.nullish(),
    other: z.string().nullish(),
    quantity: z.number().nullish(),
    volume: z
      .number()
      .positive("Le volume doit être un nombre positif")
      .nullish(),
    identificationNumbers: z.array(z.string()).nullish()
  })
  .refine(val => val.type !== "OTHER" || !!val.other, {
    message:
      "Vous devez saisir la description du conditionnement quand le type de conditionnement est 'Autre'"
  });

export const rawBsdaSchema = z.object({
  type: z.nativeEnum(BsdaType).default(BsdaType.OtherCollections),
  emitter: z.object({
    company: zodCompany,
    isPrivateIndividual: z.boolean().nullish(),
    customInfo: z.string().nullish(),
    pickupSite: z.object({
      name: z.string().nullish(),
      address: z.string().nullish(),
      city: z.string().nullish(),
      postalCode: z.string().nullish(),
      infos: z.string().nullish()
    }),
    emission: z
      .object({
        signature: zodSignature
      })
      .nullish()
  }),
  ecoOrganisme: z
    .object({
      name: z.string().nullish(),
      siret: z.string().nullish()
    })
    .nullish(),
  waste: z
    .object({
      code: ZodWasteCodeEnum,
      familyCode: z.string().nullish(),
      materialName: z.string().nullish(),
      consistence: z.nativeEnum(BsdaConsistence).nullish(),
      consistenceDescription: z.string().nullish(),
      sealNumbers: z.array(z.string()).default([]),
      isSubjectToADR: z.boolean().nullish(),
      adr: z.string().nullish(),
      nonRoadRegulationMention: z.string().nullish(),
      pop: z.boolean().nullish()
    })
    .nullish(),
  packagings: z.array(bsdaPackagingSchema).nullish(),
  weight: z.object({
    isEstimate: z.boolean().nullish(),
    value: z.number().nullish()
  }),
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
  hasBroker: z.boolean().nullish(),
  hasIntermediaries: z.boolean().nullish(),
  destination: z
    .object({
      company: zodCompany,
      cap: z.string().nullish(),
      plannedOperationCode: ZodOperationEnum,
      customInfo: z.string().nullish(),
      reception: z
        .object({
          date: z.coerce.date().nullish(),
          weight: z.number().nullish(),
          refusedWeight: z.number().min(0).nullish(),
          acceptationStatus: z.nativeEnum(WasteAcceptationStatus).nullish(),
          refusalReason: z.string().nullish(),
          signature: zodSignature
        })
        .nullish(),
      operation: z
        .object({
          code: ZodOperationEnum.nullish(),
          mode: z.nativeEnum(OperationMode).nullish(),
          description: z.string().nullish(),
          date: z.coerce
            .date()
            .nullish()
            .refine(val => !val || val < new Date(), {
              message: "La date d'opération ne peut pas être dans le futur."
            }),
          signature: zodSignature,
          nextDestination: z
            .object({
              company: zodCompany,
              cap: z.string().nullish(),
              plannedOperationCode: z.string().nullish()
            })
            .nullish()
        })
        .nullish()
    })
    .nullish(),
  worker: z.object({
    isDisabled: z.boolean().nullish(),
    company: zodCompany,
    certification: z
      .object({
        hasSubSectionFour: z.boolean().nullish(),
        hasSubSectionThree: z.boolean().nullish(),
        certificationNumber: z.string().nullish(),
        validityLimit: z.coerce.date().nullish(),
        organisation: z.string().nullish()
      })
      .nullish(),
    work: z.object({
      hasEmitterPaperSignature: z.boolean().nullish(),
      signature: zodSignature
    })
  }),
  transporters: z
    .array(
      z
        .object({
          number: z.number().nullish(),
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
  grouping: z.array(z.string()).optional().nullish(),
  forwarding: z.string().nullish(),
  intermediaries: z.array(zodCompany).nullish(),
  intermediariesOrgIds: z.array(z.string()).optional(),
  transportersOrgIds: z.array(z.string()).optional()
});

export type ZodBsda = z.infer<typeof rawBsdaSchema>;
