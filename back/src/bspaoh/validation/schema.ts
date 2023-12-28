import { z } from "zod";
import { WasteAcceptationStatus, TransportMode } from "@prisma/client";
import getReadableId, { ReadableIdPrefix } from "../../forms/readableId";
import {
  siretSchema,
  isCrematoriumRefinement,
  foreignVatNumberSchema,
  isRegisteredVatNumberRefinement
} from "../../common/validation/siret";
import { BSPAOH_WASTE_CODES, BSPAOH_WASTE_TYPES } from "shared/constants";

export const BSPAOH_OPERATIONS = ["R 1", "D 10"] as const;

const bspaohPackagingSchema = z.object({
  id: z.string(),
  type: z.enum(["LITTLE_BOX", "BIG_BOX", "RELIQUAIRE"]),
  volume: z.number(),
  containerNumber: z.string(),
  quantity: z.number().positive().lte(1),
  identificationCodes: z.array(z.string()).default([]),
  consistence: z.enum(["SOLIDE", "LIQUIDE"])
});

const bspaohPackagingAcceptationSchema = z.object({
  id: z.string(),
  acceptation: z.enum(["PENDING", "ACCEPTED", "REFUSED"])
});

const rawBspaohSchema = z.object({
  id: z.string().default(() => getReadableId(ReadableIdPrefix.PAOH)),
  status: z.string().default("INITIAL"),
  // waste
  wasteType: z.enum(BSPAOH_WASTE_TYPES).default("PAOH"),
  wasteCode: z
    .enum(BSPAOH_WASTE_CODES, { invalid_type_error: "Ce code déchet " })
    .nullish(),
  wasteAdr: z.string().nullish(),
  wastePackagings: z
    .array(bspaohPackagingSchema)
    .default([])
    .transform(val => val ?? []),

  // emitter
  emitterCompanyName: z.string().nullish(),
  emitterCompanySiret: siretSchema.nullish(),
  emitterCompanyAddress: z.string().nullish(),
  emitterCompanyContact: z.string().nullish(),
  emitterCompanyPhone: z.string().nullish(),
  emitterCompanyMail: z.string().nullish(),
  emitterCustomInfo: z.string().nullish(),
  // pickup
  emitterPickupSiteName: z.string().nullish(),
  emitterPickupSiteAddress: z.string().nullish(),
  emitterPickupSiteCity: z.string().nullish(),
  emitterPickupSitePostalCode: z.string().nullish(),
  emitterPickupSiteInfos: z.string().nullish(),

  emitterWasteQuantityValue: z.number().nullish(),
  emitterWasteWeightValue: z.number().nullish(),
  emitterWasteWeightIsEstimate: z.boolean().nullish(),

  // emitter signature
  emitterEmissionSignatureAuthor: z.string().nullish(),
  emitterEmissionSignatureDate: z.coerce.date().nullish(),

  // destination
  destinationCompanyName: z.string().nullish(),
  destinationCompanySiret: siretSchema
    .nullish()
    .superRefine(isCrematoriumRefinement),
  destinationCompanyAddress: z.string().nullish(),
  destinationCompanyContact: z.string().nullish(),
  destinationCompanyPhone: z.string().nullish(),
  destinationCompanyMail: z.string().nullish(),
  destinationCustomInfo: z.string().nullish(),
  destinationCap: z.string().nullish(),

  // reception
  handedOverToDestinationDate: z.coerce.date().nullish(),
  handedOverToDestinationSignatureDate: z.coerce.date().nullish(),
  handedOverToDestinationSignatureAuthor: z.string().nullish(),
  destinationReceptionDate: z.coerce.date().nullish(),

  destinationReceptionWasteWeightValue: z.number().nullish(),
  destinationReceptionWasteWeightIsEstimate: z.boolean().nullish(),
  destinationReceptionWasteQuantityValue: z.number().nullish(),
  destinationReceptionAcceptationStatus: z
    .nativeEnum(WasteAcceptationStatus)
    .nullish(),
  destinationReceptionWasteRefusalReason: z.string().nullish(),
  destinationReceptionWastePackagingsAcceptation: z
    .array(bspaohPackagingAcceptationSchema)
    .default([])
    .transform(val => val ?? []),
  destinationReceptionSignatureDate: z.coerce.date().nullish(),
  destinationReceptionSignatureAuthor: z.string().nullish(),
  //operation

  destinationOperationCode: z.enum(BSPAOH_OPERATIONS).nullish(),

  destinationOperationDescription: z.string().nullish(),
  destinationOperationDate: z.coerce
    .date()
    .nullish()
    .refine(val => !val || val < new Date(), {
      message: "La date d'opération ne peut pas être dans le futur."
    }),
  destinationOperationSignatureDate: z.coerce.date().nullish(),
  destinationOperationSignatureAuthor: z.string().nullish()
});

export type ZodBspaoh = z.infer<typeof rawBspaohSchema>;

const rawBspaohTransporterSchema = z.object({
  transporterCompanyName: z.string().nullish(),
  transporterCompanySiret: siretSchema.nullish(), // Further verifications done here under in superRefine
  transporterCompanyAddress: z.string().nullish(),
  transporterCompanyContact: z.string().nullish(),
  transporterCompanyPhone: z.string().nullish(),
  transporterCompanyMail: z.string().nullish(),
  transporterCompanyVatNumber: foreignVatNumberSchema
    .nullish()
    .superRefine(isRegisteredVatNumberRefinement),
  transporterCustomInfo: z.string().nullish(),
  transporterRecepisseIsExempted: z.coerce
    .boolean()
    .nullish()
    .transform(v => Boolean(v)),
  transporterRecepisseNumber: z.string().nullish(),
  transporterRecepisseDepartment: z.string().nullish(),
  transporterRecepisseValidityLimit: z.coerce.date().nullish(),
  transporterTransportMode: z.nativeEnum(TransportMode).nullish(),
  transporterTakenOverAt: z.coerce.date().nullish(),
  transporterTransportPlates: z
    .array(z.string())
    .max(2, "Un maximum de 2 plaques d'immatriculation est accepté")
    .default([]),
  transporterTransportTakenOverAt: z.coerce.date().nullish(),
  transporterTransportSignatureAuthor: z.string().nullish(),
  transporterTransportSignatureDate: z.coerce.date().nullish()
});

export type ZodBspaohTransporter = z.infer<typeof rawBspaohTransporterSchema>;

const rawFullBspaohSchema = rawBspaohSchema.merge(rawBspaohTransporterSchema);

export const fullBspaohSchema = rawFullBspaohSchema
  .superRefine((val, ctx) => {
    // refine date order
    if (
      val.destinationReceptionDate &&
      val.destinationOperationDate &&
      val.destinationOperationDate < val.destinationReceptionDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `La date d'opération doit être postérieure à la date de réception`
      });
    }
    // refine packagings
    if (
      val.wasteType == "FOETUS" &&
      val.wastePackagings.map(p => p.consistence).includes("LIQUIDE")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `La consistance ne peut être liquide pour ce type de déchet`
      });
    }

    // refine acceptation status
  })
  .transform(val => {
    return val;
  });
export type ZodFullBspaoh = z.infer<typeof rawBspaohSchema> &
  ZodBspaohTransporter;
