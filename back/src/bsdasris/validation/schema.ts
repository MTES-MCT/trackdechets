import { z } from "zod";
import {
  WasteAcceptationStatus,
  BsdasriType,
  TransportMode,
  OperationMode
} from "@prisma/client";
import {
  DASRI_ALL_OPERATIONS_CODES,
  DASRI_WASTE_CODES_VALUES
} from "@td/constants";
import {
  CompanyRole,
  foreignVatNumberSchema,
  siretSchema
} from "../../common/validation/zod/schema";

import { BsdasriValidationContext } from "./types";
import { runTransformers, fillIntermediariesOrgIds } from "./transformers";
import { weightSchema } from "../../common/validation/weight";
import { WeightUnits } from "../../common/validation";
import {
  checkCompanies,
  checkWeights,
  checkRequiredFields,
  checkOperationMode,
  validateSynthesisTransporterAcceptation,
  validateSynthesisDestinationAcceptation,
  validateRecipientIsCollectorForGroupingCodes,
  validateDestinationOperationCode,
  forbidSynthesisTraderBrokerIntermediaries,
  validateCap
} from "./refinements";
import getReadableId, { ReadableIdPrefix } from "../../forms/readableId";

import { ERROR_TRANSPORTER_PLATES_TOO_MANY } from "../../common/validation/messages";
import { validateTransporterPlates } from "../../common/validation/zod/refinement";
import {
  intermediariesRefinement,
  intermediarySchema
} from "../../common/validation/intermediaries";
import { fixOperationModeForD9F } from "../../bsda/validation/transformers";

const ZodBsdasriWasteCodeEnum = z.enum(DASRI_WASTE_CODES_VALUES).nullish();

export type ZodBsdasriWasteCodeEnum = z.infer<typeof ZodBsdasriWasteCodeEnum>;

export const ZodOperationEnum = z
  .enum(DASRI_ALL_OPERATIONS_CODES, {
    errorMap: (issue, ctx) => {
      if (issue.code === z.ZodIssueCode.invalid_enum_value) {
        return {
          message:
            "Cette opération d’élimination / valorisation n'existe pas ou n'est pas appropriée"
        };
      }
      return { message: ctx.defaultError };
    }
  })
  .nullish();
export type ZodOperationEnum = z.infer<typeof ZodOperationEnum>;

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
    quantity: z
      .number()
      .positive("La quantité doit être un nombre positif")
      .nullish(),
    volume: z
      .number()
      .positive("Le volume doit être un nombre positif")
      .nullish()
  })
  .refine(val => val.type !== "AUTRE" || !!val.other, {
    message:
      "Vous devez saisir la description du conditionnement quand le type de conditionnement est 'Autre'"
  });

export type BsdasriPackagingSchema = z.input<typeof bsdasriPackagingSchema>;
/**
 * Zod schema for the Bsdasri model
 */
export const rawBsdasriSchema = z.object({
  // Base fields
  id: z.string().default(() => getReadableId(ReadableIdPrefix.DASRI)),
  type: z.nativeEnum(BsdasriType).default(BsdasriType.SIMPLE),
  createdAt: z.date().nullish(),
  isDeleted: z.boolean().default(false),
  isDraft: z.boolean().default(false),

  // Emitter fields
  emitterCompanyName: z.string().nullish(),
  emitterCompanySiret: siretSchema(CompanyRole.Emitter).nullish(),
  emitterCompanyAddress: z.string().nullish(),
  emitterCompanyContact: z.string().nullish(),
  emitterCompanyPhone: z.string().nullish(),
  emitterCompanyMail: z.string().email("E-mail émetteur invalide").nullish(),
  emitterPickupSiteName: z.string().nullish(),
  emitterPickupSiteAddress: z.string().nullish(),
  emitterPickupSiteCity: z.string().nullish(),
  emitterPickupSitePostalCode: z.string().nullish(),
  emitterPickupSiteInfos: z.string().nullish(),
  emitterWasteVolume: z.number().nullish(),
  emitterWastePackagings: z
    .array(bsdasriPackagingSchema)
    .nullish()
    .default([])
    .transform(val => (val == null ? [] : val)),

  emitterWasteWeightValue: weightSchema(WeightUnits.Kilogramme).nullish(),
  emitterWasteWeightIsEstimate: z.boolean().nullish(),
  emitterCustomInfo: z.string().nullish(),
  emitterEmissionSignatureAuthor: z.string().nullish(),
  emitterEmissionSignatureDate: z.coerce.date().nullish(),
  isEmissionDirectTakenOver: z.boolean().nullish().default(false),
  isEmissionTakenOverWithSecretCode: z.boolean().nullish().default(false),

  // Waste fields
  wasteCode: ZodBsdasriWasteCodeEnum,
  wasteAdr: z.string().nullish(),

  // Transporter fields
  transporterCompanyName: z.string().nullish(),
  transporterCompanySiret: siretSchema(CompanyRole.Transporter).nullish(),
  transporterCompanyAddress: z.string().nullish(),
  transporterCompanyPhone: z.string().nullish(),
  transporterCompanyContact: z.string().nullish(),
  transporterCompanyMail: z
    .string()
    .email("E-mail transporteur invalide")
    .nullish(),
  transporterRecepisseNumber: z.string().nullish(),
  transporterRecepisseDepartment: z.string().nullish(),
  transporterRecepisseValidityLimit: z.coerce.date().nullish(),
  transporterRecepisseIsExempted: z.boolean().nullish(),
  transporterAcceptationStatus: z
    .nativeEnum(WasteAcceptationStatus)
    .nullish()
    .nullable(),
  transporterWasteRefusalReason: z.string().nullish(),
  transporterWasteRefusedWeightValue: weightSchema(
    WeightUnits.Kilogramme
  ).nullish(),
  transporterTakenOverAt: z.coerce.date().nullish(),
  transporterWastePackagings: z
    .array(bsdasriPackagingSchema)
    .nullish()
    .default([])
    .transform(val => (val == null ? [] : val)),
  transporterWasteWeightValue: weightSchema(WeightUnits.Kilogramme).nullish(),
  transporterWasteVolume: z.number().nullish(),
  transporterCustomInfo: z.string().nullish(),
  transporterTransportSignatureAuthor: z.string().nullish(),
  transporterTransportSignatureDate: z.coerce.date().nullish(),
  handedOverToRecipientAt: z.coerce.date().nullish(),
  transporterTransportMode: z
    .nativeEnum(TransportMode)
    .nullish()
    .default(TransportMode.ROAD),
  transporterWasteWeightIsEstimate: z.boolean().nullish(),
  transporterTransportPlates: z
    .array(z.string())
    .max(2, ERROR_TRANSPORTER_PLATES_TOO_MANY)
    .default([]),
  transporterCompanyVatNumber: foreignVatNumberSchema(
    CompanyRole.Transporter
  ).nullish(),

  // Destination fields
  destinationCap: z.string().nullish(),
  destinationCompanyName: z.string().nullish(),
  destinationCompanySiret: siretSchema(CompanyRole.Destination).nullish(),
  destinationCompanyAddress: z.string().nullish(),
  destinationCompanyContact: z.string().nullish(),
  destinationCompanyPhone: z.string().nullish(),
  destinationCompanyMail: z
    .string()
    .email("E-mail destinataire invalide")
    .nullish(),
  destinationCustomInfo: z.string().nullish(),
  destinationWastePackagings: z
    .array(bsdasriPackagingSchema)
    .nullish()
    .default([])
    .transform(val => (val == null ? [] : val)),
  destinationReceptionAcceptationStatus: z
    .nativeEnum(WasteAcceptationStatus)
    .nullish(),
  destinationReceptionWasteRefusalReason: z.string().nullish(),
  destinationReceptionWasteRefusedWeightValue: weightSchema(
    WeightUnits.Kilogramme
  ).nullish(),
  destinationReceptionWasteWeightValue: weightSchema(
    WeightUnits.Kilogramme
  ).nullish(),
  destinationReceptionWasteVolume: z.number().nullish(),
  destinationReceptionDate: z.coerce.date().nullish(),
  destinationOperationCode: ZodOperationEnum,
  destinationOperationDate: z.coerce.date().nullish(),
  destinationReceptionSignatureAuthor: z.string().nullish(),
  destinationReceptionSignatureDate: z.coerce.date().nullish(),
  destinationOperationSignatureDate: z.coerce.date().nullish(),
  destinationOperationSignatureAuthor: z.string().nullish(),
  destinationOperationMode: z.nativeEnum(OperationMode).nullish(),

  // Eco-organisme fields
  ecoOrganismeName: z.string().nullish(),
  ecoOrganismeSiret: siretSchema(CompanyRole.EcoOrganisme).nullish(),
  emittedByEcoOrganisme: z.boolean().default(false),

  // broker
  brokerCompanyName: z.string().nullish(),
  brokerCompanySiret: siretSchema(CompanyRole.Broker).nullish(),
  brokerCompanyAddress: z.string().nullish(),
  brokerCompanyContact: z.string().nullish(),
  brokerCompanyPhone: z.string().nullish(),
  brokerCompanyMail: z.string().nullish(),
  brokerRecepisseNumber: z.string().nullish(),
  brokerRecepisseDepartment: z.string().nullish(),
  brokerRecepisseValidityLimit: z.coerce.date().nullish(),

  // trader
  traderCompanyName: z.string().nullish(),
  traderCompanySiret: siretSchema(CompanyRole.Trader).nullish(),
  traderCompanyAddress: z.string().nullish(),
  traderCompanyContact: z.string().nullish(),
  traderCompanyPhone: z.string().nullish(),
  traderCompanyMail: z.string().nullish(),
  traderRecepisseNumber: z.string().nullish(),
  traderRecepisseDepartment: z.string().nullish(),
  traderRecepisseValidityLimit: z.coerce.date().nullish(),

  // intermediaries
  intermediaries: z
    .array(intermediarySchema)
    .nullish()
    .superRefine(intermediariesRefinement), // max 3
  intermediariesOrgIds: z.array(z.string()).optional(),

  // Identification fields
  identificationNumbers: z.array(z.string()).optional(),

  // Grouping/Synthesizing fields
  grouping: z.array(z.string()).optional().nullish(),
  synthesizing: z.array(z.string()).optional().nullish()
});

// Type inféré par Zod - avant parsing
// Voir https://zod.dev/?id=type-inference
export type ZodBsdasri = z.input<typeof rawBsdasriSchema>;

// Type inféré par Zod - après parsing par le schéma "brut".
// On pourra utiliser ce type en entrée et en sortie dans les refinements et
// les transformers qui arrivent après le parsing initial (on fait pour cela
// la supposition que les transformers n'apportent pas de modification au typage)
// Voir https://zod.dev/?id=type-inference
export type ParsedZodBsdasri = z.output<typeof rawBsdasriSchema>;

const refinedBsdasriSchema = rawBsdasriSchema
  .superRefine(checkWeights)
  .superRefine(validateTransporterPlates)
  .superRefine(validateCap)
  .superRefine(checkOperationMode);

// Transformations synchrones qui sont toujours jouées
const transformedBsdasriSyncSchema = refinedBsdasriSchema.transform(
  fillIntermediariesOrgIds
);
/**
 * Modification du schéma Zod pour appliquer des transformations et
 * des vérifications **synchrones** qui nécessite de connaitre le contexte d'appel.
 *
 * Exemple : pour valider les champs requis dans une mutation de signature,
 * je dois connaitre le type de signature.
 */
export const contextualBsdasriSchema = (context: BsdasriValidationContext) => {
  return transformedBsdasriSyncSchema.superRefine(checkRequiredFields(context));
};

/**
 * Modification du schéma Zod pour appliquer des transformations et
 * des vérifications **asynchrones** qui nécessitent de connaitre le contexte d'appel.
 */
export const contextualBsdasriSchemaAsync = (
  context: BsdasriValidationContext
) => {
  return transformedBsdasriSyncSchema
    .superRefine(checkCompanies)
    .transform((bsdasri: ParsedZodBsdasri) => runTransformers(bsdasri, context))
    .transform(fixOperationModeForD9F)
    .superRefine(validateSynthesisTransporterAcceptation(context))
    .superRefine(validateSynthesisDestinationAcceptation(context))
    .superRefine(validateRecipientIsCollectorForGroupingCodes(context))
    .superRefine(validateDestinationOperationCode(context))
    .superRefine(forbidSynthesisTraderBrokerIntermediaries())
    .superRefine(
      // run le check sur les champs requis après les transformations
      // au cas où des transformations auto-complètent certains champs
      checkRequiredFields(context)
    );
};
