import { z } from "zod";
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
  checkTransportModeAndReceptionWeight,
  checkNextDestinationCompany
} from "./refinements";
import { BsvhuValidationContext } from "./types";
import { weightSchema } from "../../common/validation/weight";
import { WeightUnits } from "../../common/validation";
import {
  validateMultiTransporterPlates,
  validateTransporterPlates
} from "../../common/validation/zod/refinement";
import {
  CompanyRole,
  countryCodeSchema,
  foreignVatNumberSchema,
  rawTransporterSchema,
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
import {
  fillIntermediariesOrgIds,
  runTransformers,
  updateTransporterRecepisse
} from "./transformers";
import { sirenifyBsvhuTransporter } from "./sirenify";

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

const rawBsvhuTransporterSchema = z
  .object({
    createdAt: z.date().nullish(),
    bsvhuId: z.string().nullish()
  })
  .merge(rawTransporterSchema);

const rawBsvhuSchema = z.object({
  id: z
    .string()
    .max(50)
    .default(() => getReadableId(ReadableIdPrefix.VHU)),
  // on ajoute `createdAt` au schéma de validation pour appliquer certaines
  // règles de façon contextuelles en fonction de la date de création du BSFF.
  // Cela permet de faire évoluer le schéma existant lors d'une MEP sans bloquer
  // en cours de route des bordereaux qui ont déjà été publié sur la base d'une
  // ancienne version du schéma.
  customId: z.string().max(150).nullish(),
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
  emitterCompanyName: z.string().max(150).nullish(),
  emitterCompanySiret: siretSchema(CompanyRole.Emitter).nullish(),
  emitterCompanyAddress: z.string().max(150).nullish(),
  emitterCompanyStreet: z.string().max(150).nullish(),
  emitterCompanyCity: z.string().max(150).nullish(),
  emitterCompanyPostalCode: z.string().max(150).nullish(),
  emitterCompanyContact: z.string().max(150).nullish(),
  emitterCompanyPhone: z.string().max(150).nullish(),
  emitterCompanyMail: z
    .string()
    .max(150)
    .email("E-mail émetteur invalide")
    .nullish(),
  emitterCustomInfo: z.string().max(150).nullish(),
  emitterEmissionSignatureAuthor: z.string().max(150).nullish(),
  emitterEmissionSignatureDate: z.coerce.date().nullish(),
  destinationType: z.nativeEnum(BsvhuDestinationType).nullish(),
  destinationPlannedOperationCode: ZodOperationEnum,
  destinationAgrementNumber: z.string().max(100).nullish(),
  destinationCompanyName: z.string().max(150).nullish(),
  destinationCompanySiret: siretSchema(CompanyRole.Destination).nullish(),
  destinationCompanyAddress: z.string().max(150).nullish(),
  destinationCompanyContact: z.string().max(150).nullish(),
  destinationCompanyPhone: z.string().max(150).nullish(),
  destinationCompanyMail: z
    .string()
    .max(150)
    .email("E-mail destinataire invalide")
    .nullish(),
  destinationReceptionAcceptationStatus: z
    .nativeEnum(WasteAcceptationStatus)
    .nullish(),
  destinationReceptionRefusalReason: z.string().max(150).nullish(),
  destinationReceptionIdentificationNumbers: z
    .array(z.string().max(150))
    .optional(),
  destinationReceptionIdentificationType: z
    .nativeEnum(BsvhuIdentificationType)
    .nullish(),
  destinationOperationCode: ZodOperationEnum,
  destinationOperationNextDestinationCompanyName: z.string().max(150).nullish(),
  destinationOperationNextDestinationCompanySiret: siretSchema(
    CompanyRole.NextDestination
  ).nullish(),
  destinationOperationNextDestinationCompanyVatNumber: foreignVatNumberSchema(
    CompanyRole.NextDestination
  ).nullish(),
  destinationOperationNextDestinationCompanyExtraEuropeanId: z
    .string()
    .max(150)
    .nullish(),
  destinationOperationNextDestinationCompanyAddress: z
    .string()
    .max(150)
    .nullish(),
  destinationOperationNextDestinationCompanyCountry: countryCodeSchema(
    CompanyRole.DestinationOperationNextDestination
  ).nullish(),
  destinationOperationNextDestinationCompanyContact: z
    .string()
    .max(150)
    .nullish(),
  destinationOperationNextDestinationCompanyPhone: z
    .string()
    .max(150)
    .nullish(),
  destinationOperationNextDestinationCompanyMail: z
    .string()
    .max(150)
    .email("E-mail destinataire suivant invalide")
    .nullish(),
  destinationOperationSignatureAuthor: z.string().max(150).nullish(),
  destinationOperationSignatureDate: z.coerce.date().nullish(),
  destinationOperationDate: z.coerce.date().nullish(),
  destinationReceptionQuantity: z.number().nullish(),
  destinationReceptionWeight: weightSchema(WeightUnits.Kilogramme)
    .nonnegative("Le poids doit être supérieur à 0")
    .nullish(),
  destinationReceptionDate: z.coerce.date().nullish(),
  destinationCustomInfo: z.string().max(150).nullish(),
  destinationOperationMode: z.nativeEnum(OperationMode).nullish(),
  destinationReceptionSignatureAuthor: z.string().max(150).nullish(),
  destinationReceptionSignatureDate: z.coerce.date().nullish(),
  wasteCode: ZodWasteCodeEnum,
  packaging: z.nativeEnum(BsvhuPackaging).nullish(),
  identificationNumbers: z.array(z.string().max(150)).optional(),
  identificationType: z.nativeEnum(BsvhuIdentificationType).nullish(), // see refinements
  quantity: z.number().nullish(),
  weightValue: weightSchema(WeightUnits.Kilogramme)
    .nonnegative("Le poids doit être supérieur à 0")
    .nullish(),
  weightIsEstimate: z
    .boolean()
    .nullish()
    .transform(v => Boolean(v)),

  transporters: z
    .array(rawBsvhuTransporterSchema)
    .max(5, "Vous ne pouvez pas ajouter plus de 5 transporteurs")
    .optional(),

  ecoOrganismeName: z.string().max(150).nullish(),
  ecoOrganismeSiret: siretSchema(CompanyRole.EcoOrganisme).nullish(),
  brokerCompanyName: z.string().max(150).nullish(),
  brokerCompanySiret: siretSchema(CompanyRole.Broker).nullish(),
  brokerCompanyAddress: z.string().max(150).nullish(),
  brokerCompanyContact: z.string().max(150).nullish(),
  brokerCompanyPhone: z.string().max(150).nullish(),
  brokerCompanyMail: z.string().max(150).nullish(),
  brokerRecepisseNumber: z.string().max(150).nullish(),
  brokerRecepisseDepartment: z.string().max(150).nullish(),
  brokerRecepisseValidityLimit: z.coerce.date().nullish(),
  traderCompanyName: z.string().max(150).nullish(),
  traderCompanySiret: siretSchema(CompanyRole.Trader).nullish(),
  traderCompanyAddress: z.string().max(150).nullish(),
  traderCompanyContact: z.string().max(150).nullish(),
  traderCompanyPhone: z.string().max(150).nullish(),
  traderCompanyMail: z.string().nullish(),
  traderRecepisseNumber: z.string().max(150).nullish(),
  traderRecepisseDepartment: z.string().max(150).nullish(),
  traderRecepisseValidityLimit: z.coerce.date().nullish(),
  intermediaries: z
    .array(intermediarySchema)
    .nullish()
    .superRefine(intermediariesRefinement),
  intermediariesOrgIds: z.array(z.string().max(150)).optional(),
  transportersOrgIds: z.array(z.string().max(150)).optional(),
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
  .superRefine(checkNextDestinationCompany)
  .superRefine(checkPackagingAndIdentificationType)
  .superRefine(checkTransportModeAndWeight)
  .superRefine(checkTransportModeAndReceptionWeight)
  .superRefine(validateMultiTransporterPlates);

// Transformations synchrones qui sont toujours
// joués même si `enableCompletionTransformers=false`
const transformedBsvhuSyncSchema = refinedBsvhuSchema.transform(
  fillIntermediariesOrgIds
);

/**
 * Modification du schéma Zod pour appliquer des transformations et
 * des vérifications **synchrones** qui nécessite de connaitre le contexte d'appel.
 *
 * Exemple : pour valider les champs requis dans une mutation de signature,
 * je dois connaitre le type de signature.
 */
export const contextualBsvhuSchema = (context: BsvhuValidationContext) => {
  return transformedBsvhuSyncSchema.superRefine(checkRequiredFields(context));
};

/**
 * Modification du schéma Zod pour appliquer des transformations et
 * des vérifications **asynchrones** qui nécessite de connaitre le contexte d'appel.
 */
export const contextualBsvhuSchemaAsync = (context: BsvhuValidationContext) => {
  return transformedBsvhuSyncSchema
    .superRefine((bsvhu, zodContext) =>
      checkCompanies(bsvhu, zodContext, context)
    )
    .transform((bsvhu: ParsedZodBsvhu) => runTransformers(bsvhu, context))
    .superRefine(
      // run le check sur les champs requis après les transformations
      // au cas où des transformations auto-complètent certains champs
      checkRequiredFields(context)
    );
};

export type ZodBsvhuTransporter = z.input<typeof rawBsvhuTransporterSchema>;

export type ParsedZodBsvhuTransporter = z.output<
  typeof rawBsvhuTransporterSchema
>;

const refinedBsvhuTransporter = rawBsvhuTransporterSchema.superRefine(
  validateTransporterPlates
);

export const transformedBsvhuTransporterSchema = refinedBsvhuTransporter
  .transform(updateTransporterRecepisse)
  .transform(sirenifyBsvhuTransporter);
