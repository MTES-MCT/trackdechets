import { z } from "@td/validation";
import getReadableId, { ReadableIdPrefix } from "../../forms/readableId";

import {
  checkCompanies,
  checkWeights,
  checkRequiredFields,
  checkOperationMode,
  checkReceptionWeight,
  checkEmitterSituation,
  checkPackagingAndIdentificationType,
  checkTransportModeAndWeight,
  checkTransportModeAndReceptionWeight
} from "./refinements";
import { BsvhuValidationContext } from "./types";
import { weightSchema } from "../../common/validation/weight";
import { WeightUnits } from "../../common/validation";
import { validateTransporterPlates } from "../../common/validation/zod/refinement";
import {
  CompanyRole,
  foreignVatNumberSchema,
  siretSchema
} from "../../common/validation/zod/schema";
import {
  intermediariesRefinement,
  intermediarySchema
} from "../../common/validation/intermediaries";
import { BSVHU_WASTE_CODES, PROCESSING_OPERATIONS_CODES } from "@td/constants";
import {
  BsvhuDestinationType,
  BsvhuIdentificationType,
  BsvhuPackaging,
  OperationMode,
  WasteAcceptationStatus
} from "@prisma/client";
import { fillIntermediariesOrgIds, runTransformers } from "./transformers";
import { TransportMode } from "@prisma/client";
import { ERROR_TRANSPORTER_PLATES_TOO_MANY } from "../../common/validation/messages";

export const ZodWasteCodeEnum = z
  .enum(BSVHU_WASTE_CODES, {
    errorMap: (issue, ctx) => {
      if (issue.code === z.ZodIssueCode.invalid_enum_value) {
        return {
          message:
            `Le code déchet ne fait pas partie de la` +
            ` liste reconnue : ${BSVHU_WASTE_CODES.join(", ")}`
        };
      }
      return { message: ctx.defaultError };
    }
  })
  .nullish();

export type ZodWasteCodeEnum = z.infer<typeof ZodWasteCodeEnum>;

export const ZodOperationEnum = z
  .enum(PROCESSING_OPERATIONS_CODES as [string, ...string[]], {
    errorMap: (issue, ctx) => {
      if (issue.code === z.ZodIssueCode.invalid_enum_value) {
        return {
          message:
            "Le code de l'opération de traitement ne fait pas" +
            ` partie de la liste reconnue : ${PROCESSING_OPERATIONS_CODES.join(
              ", "
            )}`
        };
      }
      return { message: ctx.defaultError };
    }
  })
  .nullish();

export type ZodOperationEnum = z.infer<typeof ZodOperationEnum>;

const rawBsvhuSchema = z.object({
  id: z.string().default(() => getReadableId(ReadableIdPrefix.VHU)),
  // on ajoute `createdAt` au schéma de validation pour appliquer certaines
  // règles de façon contextuelles en fonction de la date de création du BSFF.
  // Cela permet de faire évoluer le schéma existant lors d'une MEP sans bloquer
  // en cours de route des bordereaux qui ont déjà été publié sur la base d'une
  // ancienne version du schéma.
  customId: z.string().nullish(),
  createdAt: z.date().nullish(),
  isDraft: z.boolean().default(false),
  isDeleted: z.boolean().default(false),

  emitterAgrementNumber: z.string().max(100).nullish(),
  emitterIrregularSituation: z
    .boolean()
    .nullish()
    .transform(v => Boolean(v)),
  emitterNoSiret: z
    .boolean()
    .nullish()
    .transform(v => Boolean(v)),
  emitterNotOnTD: z
    .boolean()
    .nullish()
    .transform(v => Boolean(v)),
  emitterCompanyName: z.string().nullish(),
  emitterCompanySiret: siretSchema(CompanyRole.Emitter).nullish(),
  emitterCompanyAddress: z.string().nullish(),
  emitterCompanyStreet: z.string().nullish(),
  emitterCompanyCity: z.string().nullish(),
  emitterCompanyPostalCode: z.string().nullish(),
  emitterCompanyContact: z.string().nullish(),
  emitterCompanyPhone: z.string().nullish(),
  emitterCompanyMail: z.string().email("E-mail émetteur invalide").nullish(),
  emitterCustomInfo: z.string().nullish(),
  emitterEmissionSignatureAuthor: z.string().nullish(),
  emitterEmissionSignatureDate: z.coerce.date().nullish(),
  destinationType: z.nativeEnum(BsvhuDestinationType).nullish(),
  destinationPlannedOperationCode: ZodOperationEnum,
  destinationAgrementNumber: z.string().max(100).nullish(),
  destinationCompanyName: z.string().nullish(),
  destinationCompanySiret: siretSchema(CompanyRole.Destination).nullish(),
  destinationCompanyAddress: z.string().nullish(),
  destinationCompanyContact: z.string().nullish(),
  destinationCompanyPhone: z.string().nullish(),
  destinationCompanyMail: z
    .string()
    .email("E-mail destinataire invalide")
    .nullish(),
  destinationReceptionAcceptationStatus: z
    .nativeEnum(WasteAcceptationStatus)
    .nullish(),
  destinationReceptionRefusalReason: z.string().nullish(),
  destinationReceptionIdentificationNumbers: z.array(z.string()).optional(),
  destinationReceptionIdentificationType: z
    .nativeEnum(BsvhuIdentificationType)
    .nullish(),
  destinationOperationCode: ZodOperationEnum,
  destinationOperationNextDestinationCompanyName: z.string().nullish(),
  destinationOperationNextDestinationCompanySiret: siretSchema(
    CompanyRole.NextDestination
  ).nullish(),
  destinationOperationNextDestinationCompanyAddress: z.string().nullish(),
  destinationOperationNextDestinationCompanyContact: z.string().nullish(),
  destinationOperationNextDestinationCompanyPhone: z.string().nullish(),
  destinationOperationNextDestinationCompanyMail: z
    .string()
    .email("E-mail destinataire suivant invalide")
    .nullish(),
  destinationOperationNextDestinationCompanyVatNumber: foreignVatNumberSchema(
    CompanyRole.NextDestination
  ).nullish(),
  destinationOperationSignatureAuthor: z.string().nullish(),
  destinationOperationSignatureDate: z.coerce.date().nullish(),
  destinationOperationDate: z.coerce.date().nullish(),
  destinationReceptionQuantity: z.number().nullish(),
  destinationReceptionWeight: weightSchema(WeightUnits.Kilogramme)
    .nonnegative("Le poids doit être supérieur à 0")
    .nullish(),
  destinationReceptionDate: z.coerce.date().nullish(),
  destinationCustomInfo: z.string().nullish(),
  destinationOperationMode: z.nativeEnum(OperationMode).nullish(),
  destinationReceptionSignatureAuthor: z.string().nullish(),
  destinationReceptionSignatureDate: z.coerce.date().nullish(),
  wasteCode: ZodWasteCodeEnum,
  packaging: z.nativeEnum(BsvhuPackaging).nullish(),
  identificationNumbers: z.array(z.string()).optional(),
  identificationType: z.nativeEnum(BsvhuIdentificationType).nullish(), // see refinements
  quantity: z.number().nullish(),
  weightValue: weightSchema(WeightUnits.Kilogramme)
    .nonnegative("Le poids doit être supérieur à 0")
    .nullish(),
  weightIsEstimate: z
    .boolean()
    .nullish()
    .transform(v => Boolean(v)),
  transporterCompanyName: z.string().nullish(),
  transporterCompanySiret: siretSchema(CompanyRole.Transporter).nullish(),
  transporterCompanyAddress: z.string().nullish(),
  transporterCompanyContact: z.string().nullish(),
  transporterCompanyPhone: z.string().nullish(),
  transporterCompanyMail: z
    .string()
    .email("E-mail transporteur invalide")
    .nullish(),
  transporterCompanyVatNumber: foreignVatNumberSchema(
    CompanyRole.Transporter
  ).nullish(),
  transporterRecepisseNumber: z.string().nullish(),
  transporterRecepisseDepartment: z.string().nullish(),
  transporterRecepisseValidityLimit: z.coerce.date().nullish(),
  transporterRecepisseIsExempted: z
    .boolean()
    .nullish()
    .transform(v => Boolean(v)),

  transporterTransportSignatureAuthor: z.string().nullish(),
  transporterTransportSignatureDate: z.coerce.date().nullish(),
  transporterTransportTakenOverAt: z.coerce.date().nullish(),
  transporterCustomInfo: z.string().nullish(),
  transporterTransportMode: z.nativeEnum(TransportMode).nullish(),

  transporterTransportPlates: z
    .array(z.string())
    .max(2, ERROR_TRANSPORTER_PLATES_TOO_MANY)
    .default([]),

  ecoOrganismeName: z.string().nullish(),
  ecoOrganismeSiret: siretSchema(CompanyRole.EcoOrganisme).nullish(),
  brokerCompanyName: z.string().nullish(),
  brokerCompanySiret: siretSchema(CompanyRole.Broker).nullish(),
  brokerCompanyAddress: z.string().nullish(),
  brokerCompanyContact: z.string().nullish(),
  brokerCompanyPhone: z.string().nullish(),
  brokerCompanyMail: z.string().nullish(),
  brokerRecepisseNumber: z.string().nullish(),
  brokerRecepisseDepartment: z.string().nullish(),
  brokerRecepisseValidityLimit: z.coerce.date().nullish(),
  traderCompanyName: z.string().nullish(),
  traderCompanySiret: siretSchema(CompanyRole.Trader).nullish(),
  traderCompanyAddress: z.string().nullish(),
  traderCompanyContact: z.string().nullish(),
  traderCompanyPhone: z.string().nullish(),
  traderCompanyMail: z.string().nullish(),
  traderRecepisseNumber: z.string().nullish(),
  traderRecepisseDepartment: z.string().nullish(),
  traderRecepisseValidityLimit: z.coerce.date().nullish(),
  intermediaries: z
    .array(intermediarySchema)
    .nullish()
    .superRefine(intermediariesRefinement),
  intermediariesOrgIds: z.array(z.string()).optional(),
  containsElectricOrHybridVehicles: z.boolean().nullish()
});

// Type inféré par Zod - avant parsing
// Voir https://zod.dev/?id=type-inference
export type ZodBsvhu = z.input<typeof rawBsvhuSchema>;

// Type inféré par Zod - après parsing par le schéma "brut".
// On pourra utiliser ce type en entrée et en sortie dans les refinements et
// les transformers qui arrivent après le parsing initial (on fait pour cela
// la supposition que les transformers n'apportent pas de modification au typage)
// Voir https://zod.dev/?id=type-inference
export type ParsedZodBsvhu = z.output<typeof rawBsvhuSchema>;

const refinedBsvhuSchema = rawBsvhuSchema
  .superRefine(checkWeights)
  .superRefine(checkReceptionWeight)
  .superRefine(checkOperationMode)
  .superRefine(checkEmitterSituation)
  .superRefine(checkPackagingAndIdentificationType)
  .superRefine(checkTransportModeAndWeight)
  .superRefine(checkTransportModeAndReceptionWeight)
  .superRefine(validateTransporterPlates);

// Transformations synchrones qui sont toujours
// joués même si `enableCompletionTransformers=false`
const transformedBsvhuSyncSchema = refinedBsvhuSchema.transform(
  fillIntermediariesOrgIds
);

/**
 * Modification du schéma Zod pour appliquer des tranformations et
 * des vérifications **synchrones** qui nécessite de connaitre le contexte d'appel.
 *
 * Exemple : pour valider les champs requis dans une mutation de signature,
 * je dois connaitre le type de signature.
 */
export const contextualBsvhuSchema = (context: BsvhuValidationContext) => {
  return transformedBsvhuSyncSchema.superRefine(checkRequiredFields(context));
};

/**
 * Modification du schéma Zod pour appliquer des tranformations et
 * des vérifications **asynchrones** qui nécessite de connaitre le contexte d'appel.
 */
export const contextualBsvhuSchemaAsync = (context: BsvhuValidationContext) => {
  return transformedBsvhuSyncSchema
    .superRefine(checkCompanies)
    .transform((bsvhu: ParsedZodBsvhu) => runTransformers(bsvhu, context))
    .superRefine(
      // run le check sur les champs requis après les transformations
      // au cas où des transformations auto-complètent certains champs
      checkRequiredFields(context)
    );
};
