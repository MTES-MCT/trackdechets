import { z } from "zod";
import {
  OperationMode,
  BsdasriStatus,
  BsdasriType,
  Bsdasri
} from "@prisma/client";

import { getOperationModesFromOperationCode } from "../common/operationModes";
import { capitalize } from "../common/strings";

// Dasri still uses yup for main validation but migration to zod is on its way
const ZodWasteCodeEnum = z.enum(["18 01 03*", "18 02 02*"]).nullish();
const ZodOperationEnum = z.enum(["D9", "D10", "R1"]).nullish();

const ZodBsdasriPackagingEnum = z.enum([
  "BOITE_CARTON",
  "FUT",
  "BOITE_PERFORANTS",
  "GRAND_EMBALLAGE",
  "GRV",
  "AUTRE"
]);
export type ZodBsdasriPackagingEnum = z.infer<typeof ZodBsdasriPackagingEnum>;

export const bsdasriPackagingSchema = z
  .object({
    type: ZodBsdasriPackagingEnum.nullish(),
    other: z.string().nullish(),
    quantity: z.number().nullish()
  })
  .refine(val => val.type !== "AUTRE" || !!val.other, {
    message:
      "Vous devez saisir la description du conditionnement quand le type de conditionnement est 'Autre'"
  });

export const revisionSchema = z
  .object({
    isCanceled: z.boolean().nullish(),

    wasteCode: ZodWasteCodeEnum,

    destinationWastePackagings: z
      .array(bsdasriPackagingSchema)

      .default([])
      .transform(val => val ?? [])
      .nullish(),

    destinationReceptionWasteWeightValue: z.number().nullish(),

    destinationOperationCode: ZodOperationEnum.nullish(),
    destinationOperationMode: z.nativeEnum(OperationMode).nullish(),

    emitterPickupSiteName: z.string().nullish(),
    emitterPickupSiteAddress: z.string().nullish(),
    emitterPickupSiteCity: z.string().nullish(),
    emitterPickupSitePostalCode: z.string().nullish(),
    emitterPickupSiteInfos: z.string().nullish()
  })
  .superRefine((val, ctx) => {
    const { destinationOperationCode, destinationOperationMode } = val;
    if (destinationOperationCode) {
      const modes = getOperationModesFromOperationCode(
        destinationOperationCode
      );

      if (modes.length && !destinationOperationMode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Vous devez préciser un mode de traitement"
        });
      } else if (
        (modes.length &&
          destinationOperationMode &&
          !modes.includes(destinationOperationMode)) ||
        (!modes.length && destinationOperationMode)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Le mode de traitement n'est pas compatible avec l'opération de traitement choisie"
        });
      }
    }

    // The difference with the raw bsdasri schema is that most fields must not be empty
    const nonEmptyFields = [
      "wasteCode",
      "destinationWastePackagings",
      "destinationOperationCode",
      "destinationOperationMode",
      "destinationReceptionWasteWeightValue"
    ] as const;

    for (const field of nonEmptyFields) {
      if (field in val && val[field] === null) {
        const readableFieldName = revisionRules[field].readableFieldName;

        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${
            readableFieldName ? capitalize(readableFieldName) : field
          } ne peut pas être vide`
        });
      }
    }
  });

export type ZodBsdariRevision = z.infer<typeof revisionSchema>;

type RevisionRules = Record<
  keyof Omit<ZodBsdariRevision, "isCanceled">,
  {
    readableFieldName: string;

    revisableFor: (BsdasriType) => Array<BsdasriStatus>;
  }
>;

// Règles de disponibiltés des champs de révision
// +-----------------------+-------------------------+-------------------------+-------------------------+
// |         Champ         |          Simple         |       Groupement        |        Synthèse         |
// +-----------------------+-------------------------+-------------------------+-------------------------+
// | Annulation            | sign transporteur uniqt | sign transporteur uniqt | sign transporteur uniqt |
// | Adresse d'enlèvement  | sign transporteur       | jamais                  | jamais                  |
// | Code déchet           | sign transporteur       | sign transporteur       | jamais                  |
// | Conditionnement       | sign réception          | sign réception          | jamais                  |
// | Quantité reçue (kg)   | sign traitement         | sign traitement         | sign traitement         |
// | Code opération + mode | sign traitement         | sign traitement         | sign traitement         |
// +-----------------------+-------------------------+-------------------------+-------------------------+
//  NB: A partir de, sauf mention contraire
const revisionRules: RevisionRules = {
  emitterPickupSiteName: {
    readableFieldName: "le nom du site d'enlèvement",

    revisableFor: type => {
      if (type !== BsdasriType.SIMPLE) {
        return [];
      }
      return [
        BsdasriStatus.SENT,
        BsdasriStatus.RECEIVED,
        BsdasriStatus.PROCESSED
      ];
    }
  },
  emitterPickupSiteAddress: {
    readableFieldName: "l'adresse du site d'enlèvement",

    revisableFor: type => {
      if (type !== BsdasriType.SIMPLE) {
        return [];
      }
      return [
        BsdasriStatus.SENT,
        BsdasriStatus.RECEIVED,
        BsdasriStatus.PROCESSED
      ];
    }
  },

  emitterPickupSiteCity: {
    readableFieldName: "la ville du site d'enlèvement",

    revisableFor: type => {
      if (type !== BsdasriType.SIMPLE) {
        return [];
      }
      return [
        BsdasriStatus.SENT,
        BsdasriStatus.RECEIVED,
        BsdasriStatus.PROCESSED
      ];
    }
  },
  emitterPickupSitePostalCode: {
    readableFieldName: "le doe postal du site d'enlèvement",

    revisableFor: type => {
      if (type !== BsdasriType.SIMPLE) {
        return [];
      }
      return [
        BsdasriStatus.SENT,
        BsdasriStatus.RECEIVED,
        BsdasriStatus.PROCESSED
      ];
    }
  },
  emitterPickupSiteInfos: {
    readableFieldName: "les informations relatives aux site d'enlèvement",

    revisableFor: type => {
      if (type !== BsdasriType.SIMPLE) {
        return [];
      }
      return [
        BsdasriStatus.SENT,
        BsdasriStatus.RECEIVED,
        BsdasriStatus.PROCESSED
      ];
    }
  },

  wasteCode: {
    readableFieldName: "le code déchet",

    revisableFor: type => {
      if (type === BsdasriType.SYNTHESIS) {
        return [];
      }

      return [
        BsdasriStatus.SENT,
        BsdasriStatus.RECEIVED,
        BsdasriStatus.PROCESSED
      ];
    }
  },

  destinationWastePackagings: {
    readableFieldName: "le conditionnement",

    revisableFor: type => {
      if (type === BsdasriType.SYNTHESIS) {
        return [];
      }
      return [BsdasriStatus.RECEIVED, BsdasriStatus.PROCESSED];
    }
  },
  destinationOperationCode: {
    readableFieldName: "le code de traitement",

    revisableFor: () => [BsdasriStatus.PROCESSED]
  },
  destinationOperationMode: {
    readableFieldName: "le mode de traitement",
    revisableFor: () => [BsdasriStatus.PROCESSED]
  },
  destinationReceptionWasteWeightValue: {
    readableFieldName: "le poids de déchet traité",
    revisableFor: () => [BsdasriStatus.PROCESSED]
  }
};

export const checkRevisionRules = (flatContent, bsdasri: Bsdasri) => {
  const { status, type } = bsdasri;
  // check if fields are editable
  const errors: string[] = [];
  for (const [field, value] of Object.entries(flatContent)) {
    if (value !== null) {
      if (!revisionRules[field]?.revisableFor(type)?.includes(status))
        errors.push(revisionRules[field]?.readableFieldName);
    }
  }
  if (errors.length) {
    throw new Error(
      `Les champs suivants ne sont pas révisables : ${errors.join(",")}`
    );
  }
};
