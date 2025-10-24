import { z } from "zod";
import { WasteAcceptationStatus } from "@td/prisma";
import getReadableId, { ReadableIdPrefix } from "../../forms/readableId";
import { isCrematoriumRefinement } from "./dynamicRefinements";
import { BSPAOH_WASTE_CODES, BSPAOH_WASTE_TYPES } from "@td/constants";
import {
  CompanyRole,
  siretSchema,
  rawTransporterSchema
} from "../../common/validation/zod/schema";
import {
  isRegisteredVatNumberRefinement,
  validateTransporterPlates
} from "../../common/validation/zod/refinement";

export const BSPAOH_OPERATIONS = ["R 1", "D 10"] as const;

const bspaohPackagingSchema = z.object({
  id: z.string().max(50),
  type: z.enum(["LITTLE_BOX", "BIG_BOX", "RELIQUAIRE"]),
  volume: z.number().nonnegative().nullish(),
  containerNumber: z.string().max(50),
  quantity: z.number().positive().lte(1),
  identificationCodes: z
    .array(z.string().max(250))
    .nonempty("Au moins un code est requis"),
  consistence: z.enum(["SOLIDE", "LIQUIDE"])
});

const bspaohPackagingAcceptationSchema = z.object({
  id: z.string().max(250),
  acceptation: z.enum(["PENDING", "ACCEPTED", "REFUSED"])
});

const rawBspaohSchema = z.object({
  id: z
    .string()
    .max(50)
    .default(() => getReadableId(ReadableIdPrefix.PAOH)),
  status: z.string().max(250).default("INITIAL"),
  // waste
  wasteType: z.enum(BSPAOH_WASTE_TYPES).default("PAOH"),
  wasteCode: z
    .enum(BSPAOH_WASTE_CODES, { invalid_type_error: "Ce code déchet " })
    .nullish(),
  wasteAdr: z.string().max(750).nullish(),
  wastePackagings: z
    .array(bspaohPackagingSchema)
    .default([])
    .transform(val => val ?? []),

  // emitter
  emitterCompanyName: z.string().max(250).nullish(),
  emitterCompanySiret: siretSchema(CompanyRole.Emitter).nullish(),
  emitterCompanyAddress: z.string().max(250).nullish(),
  emitterCompanyContact: z.string().max(250).nullish(),
  emitterCompanyPhone: z.string().max(250).nullish(),
  emitterCompanyMail: z.string().max(250).nullish(),
  emitterCustomInfo: z.string().max(250).nullish(),
  // pickup
  emitterPickupSiteName: z.string().max(250).nullish(),
  emitterPickupSiteAddress: z.string().max(250).nullish(),
  emitterPickupSiteCity: z.string().max(250).nullish(),
  emitterPickupSitePostalCode: z.string().max(250).nullish(),
  emitterPickupSiteInfos: z.string().max(250).nullish(),

  emitterWasteQuantityValue: z.number().nonnegative().nullish(),
  emitterWasteWeightValue: z.number().nonnegative().nullish(),
  emitterWasteWeightIsEstimate: z.boolean().nullish(),

  // emitter signature
  emitterEmissionSignatureAuthor: z.string().max(250).nullish(),
  emitterEmissionSignatureDate: z.coerce.date().nullish(),

  // destination
  destinationCompanyName: z.string().max(250).nullish(),
  destinationCompanySiret: siretSchema(CompanyRole.Destination)
    .nullish()
    .superRefine(isCrematoriumRefinement),
  destinationCompanyAddress: z.string().max(250).nullish(),
  destinationCompanyContact: z.string().max(250).nullish(),
  destinationCompanyPhone: z.string().max(250).nullish(),
  destinationCompanyMail: z.string().max(250).nullish(),
  destinationCustomInfo: z.string().max(250).nullish(),
  destinationCap: z.string().max(250).nullish(),

  // reception

  handedOverToDestinationSignatureDate: z.coerce.date().nullish(),
  handedOverToDestinationSignatureAuthor: z.string().max(250).nullish(),
  destinationReceptionDate: z.coerce.date().nullish(),

  destinationReceptionWasteReceivedWeightValue: z
    .number()
    .nonnegative()
    .nullish(),
  destinationReceptionWasteAcceptedWeightValue: z
    .number()
    .nonnegative()
    .nullish(),
  destinationReceptionWasteRefusedWeightValue: z
    .number()
    .nonnegative()
    .nullish(),

  destinationReceptionWasteQuantityValue: z.number().nonnegative().nullish(),
  destinationReceptionAcceptationStatus: z
    .nativeEnum(WasteAcceptationStatus)
    .nullish(),
  destinationReceptionWasteRefusalReason: z.string().max(250).nullish(),
  destinationReceptionWastePackagingsAcceptation: z
    .array(bspaohPackagingAcceptationSchema)
    .default([])
    .transform(val => val ?? []),
  destinationReceptionSignatureDate: z.coerce.date().nullish(),
  destinationReceptionSignatureAuthor: z.string().max(250).nullish(),

  //operation
  destinationOperationCode: z.enum(BSPAOH_OPERATIONS).nullish(),

  destinationOperationDescription: z.string().max(250).nullish(),
  destinationOperationDate: z.coerce
    .date()
    .nullish()
    .refine(val => !val || val < new Date(), {
      message: "La date d'opération ne peut pas être dans le futur."
    }),
  destinationOperationSignatureDate: z.coerce.date().nullish(),
  destinationOperationSignatureAuthor: z.string().max(250).nullish()
});

export type ZodBspaoh = z.infer<typeof rawBspaohSchema>;

const rawBspaohTransporterSchema = rawTransporterSchema
  .omit({ id: true, number: true })
  .merge(z.object({ transporterTakenOverAt: z.coerce.date().nullish() }));

export type ZodBspaohTransporter = z.infer<typeof rawBspaohTransporterSchema>;

const rawFullBspaohSchema = rawBspaohSchema.merge(rawBspaohTransporterSchema);

export const fullBspaohSchema = rawFullBspaohSchema
  .superRefine(async (val, ctx) => {
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
    // refine packagings consistence
    if (
      val.wasteType == "FOETUS" &&
      val.wastePackagings.map(p => p.consistence).includes("LIQUIDE")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `La consistance ne peut être liquide pour ce type de déchet`
      });
    }
    // refine transporter vat
    await isRegisteredVatNumberRefinement(val.transporterCompanyVatNumber, ctx);
  })

  .superRefine(validateTransporterPlates)
  .transform(val => {
    return val;
  });
export type ZodFullBspaoh = z.infer<typeof rawBspaohSchema> &
  ZodBspaohTransporter;
