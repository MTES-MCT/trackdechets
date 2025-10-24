import { z } from "zod";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { BsffPackagingType, BsffType } from "@td/prisma";

import { BSFF_WASTE_CODES } from "@td/constants";
import { BSFF_OPERATION_CODES } from "../../constants";
import {
  checkCompanies,
  checkFicheInterventions,
  checkWeights,
  checkPackagings,
  checkRequiredFields
} from "./refinements";
import { BsffValidationContext } from "./types";
import { weightSchema } from "../../../common/validation/weight";
import { WeightUnits } from "../../../common/validation";
import { sirenifyBsffTransporter } from "./sirenify";
import {
  checkAndSetPreviousPackagings,
  runTransformers,
  updateTransporterRecepisse
} from "./transformers";
import {
  CompanyRole,
  rawTransporterSchema,
  siretSchema
} from "../../../common/validation/zod/schema";
import {
  validateMultiTransporterPlates,
  validateTransporterPlates
} from "../../../common/validation/zod/refinement";

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

export type ZodOperationEnum = z.infer<typeof ZodOperationEnum>;

const rawBsffTransporterSchema = z
  .object({
    bsffId: z.string().max(50).nullish()
  })
  .merge(rawTransporterSchema);

const rawBsffPackagingSchema = z.object({
  id: z.string().max(50).nullish(),
  type: z.nativeEnum(BsffPackagingType),
  other: z.string().max(250).nullish(),
  volume: z
    .number()
    .nonnegative("Conditionnements : le volume doit être supérieur à 0")
    .nullish(),
  weight: weightSchema(WeightUnits.Kilogramme).nonnegative(
    "Conditionnements : le poids doit être supérieur à 0"
  ),
  emissionNumero: z.string().max(250),
  numero: z
    .string({
      required_error: "Conditionnements : le numéro d'identification est requis"
    })
    .max(250)
    .min(1, "Conditionnements : le numéro d'identification est requis"),
  previousPackagings: z.string().max(250).array().nullish(),
  acceptationSignatureDate: z.coerce.date().nullish(),
  operationSignatureDate: z.coerce.date().nullish()
});

const rawBsffSchema = z.object({
  id: z
    .string()
    .max(50)
    .default(() => getReadableId(ReadableIdPrefix.FF)),
  // on ajoute `createdAt` au schéma de validation pour appliquer certaines
  // règles de façon contextuelles en fonction de la date de création du BSFF.
  // Cela permet de faire évoluer le schéma existant lors d'une MEP sans bloquer
  // en cours de route des bordereaux qui ont déjà été publié sur la base d'une
  // ancienne version du schéma.
  createdAt: z.date().nullish(),
  isDraft: z.boolean().default(false),
  isDeleted: z.boolean().default(false),
  type: z
    .nativeEnum(BsffType)
    .nullish()
    .transform(t => t ?? BsffType.COLLECTE_PETITES_QUANTITES),
  emitterCompanyName: z.string().max(250).nullish(),
  emitterCompanySiret: siretSchema(CompanyRole.Emitter).nullish(),
  emitterCompanyAddress: z.string().max(250).nullish(),
  emitterCompanyContact: z.string().max(250).nullish(),
  emitterCompanyPhone: z.string().max(250).nullish(),
  emitterCompanyMail: z
    .string()
    .max(250)
    .email("E-mail émetteur invalide")
    .nullish(),
  emitterCustomInfo: z.string().max(250).nullish(),
  emitterEmissionSignatureAuthor: z.string().max(250).nullish(),
  emitterEmissionSignatureDate: z.coerce.date().nullish(),
  wasteCode: ZodWasteCodeEnum,
  wasteAdr: z.string().max(750).nullish(),
  weightValue: weightSchema(WeightUnits.Kilogramme)
    .nonnegative("Le poids doit être supérieur à 0")
    .nullish(),
  weightIsEstimate: z
    .boolean()
    .nullish()
    .transform(v => Boolean(v)),
  wasteDescription: z.string().max(250).nullish(),
  transporterTransportSignatureDate: z.coerce.date().nullish(),
  destinationCompanyName: z.string().max(250).nullish(),
  destinationCompanySiret: siretSchema(CompanyRole.Destination).nullish(),
  destinationCompanyAddress: z.string().max(250).nullish(),
  destinationCompanyContact: z.string().max(250).nullish(),
  destinationCompanyPhone: z.string().max(250).nullish(),
  destinationCompanyMail: z
    .string()
    .max(250)
    .email("E-mail destinataire invalide")
    .nullish(),
  destinationCustomInfo: z.string().max(250).nullish(),
  destinationCap: z.string().max(250).nullish(),
  destinationReceptionDate: z.coerce.date().nullish(),
  destinationReceptionSignatureAuthor: z.string().max(250).nullish(),
  destinationReceptionSignatureDate: z.coerce.date().nullish(),
  destinationPlannedOperationCode: ZodOperationEnum,
  detenteurCompanySirets: z.array(z.string().max(250)).optional(),
  transportersOrgIds: z.array(z.string().max(250)).optional(),
  transporters: z
    .array(rawBsffTransporterSchema)
    .max(5, "Vous ne pouvez pas ajouter plus de 5 transporteurs")
    .optional(),
  packagings: z.array(rawBsffPackagingSchema).nullish(),
  ficheInterventions: z.string().max(250).array().nullish(),
  forwarding: z.array(z.string().max(250)).nullish(),
  repackaging: z.array(z.string().max(250)).nullish(),
  grouping: z.array(z.string().max(250)).nullish()
});

// Type inféré par Zod - avant parsing
// Voir https://zod.dev/?id=type-inference
export type ZodBsffPackaging = z.input<typeof rawBsffPackagingSchema>;

// Type inféré par Zod - après parsing par le schéma "brut".
// On pourra utiliser ce type en entrée et en sortie dans les refinements et
// les transformers qui arrivent après le parsing initial (on fait pour cela
// la supposition que les transformers n'apportent pas de modification au typage)
// Voir https://zod.dev/?id=type-inference
export type ParsedZodBsffPackaging = z.output<typeof rawBsffPackagingSchema>;

// Type inféré par Zod - avant parsing
// Voir https://zod.dev/?id=type-inference
export type ZodBsff = z.input<typeof rawBsffSchema>;

// Type inféré par Zod - après parsing par le schéma "brut".
// On pourra utiliser ce type en entrée et en sortie dans les refinements et
// les transformers qui arrivent après le parsing initial (on fait pour cela
// la supposition que les transformers n'apportent pas de modification au typage)
// Voir https://zod.dev/?id=type-inference
export type ParsedZodBsff = z.output<typeof rawBsffSchema>;

const refinedBsffSchema = rawBsffSchema
  .superRefine(checkPackagings)
  .superRefine(checkWeights)
  .superRefine(validateMultiTransporterPlates);

/**
 * Modification du schéma Zod pour appliquer des tranformations et
 * des vérifications **synchrones** qui nécessite de connaitre le contexte d'appel.
 *
 * Exemple : pour valider les champs requis dans une mutation de signature,
 * je dois connaitre le type de signature.
 */
export const contextualBsffSchema = (context: BsffValidationContext) => {
  return refinedBsffSchema.superRefine(checkRequiredFields(context));
};

/**
 * Modification du schéma Zod pour appliquer des tranformations et
 * des vérifications **asynchrones** qui nécessite de connaitre le contexte d'appel.
 */
export const contextualBsffSchemaAsync = (context: BsffValidationContext) => {
  return refinedBsffSchema
    .superRefine(checkCompanies)
    .transform((bsff: ParsedZodBsff) => runTransformers(bsff, context))
    .superRefine(
      // run le check sur les champs requis après les transformations
      // au cas où des transformations auto-complète certains champs
      checkRequiredFields(context)
    )
    .superRefine(checkFicheInterventions)
    .transform(checkAndSetPreviousPackagings);
};

// Type inféré par Zod - avant parsing
// Voir https://zod.dev/?id=type-inference
export type ZodBsffTransporter = z.input<typeof rawBsffTransporterSchema>;

// Type inféré par Zod - après parsing par le schéma "brut".
// On pourra utiliser ce type en entrée et en sortie dans les refinements et
// les transformers qui arrivent après le parsing initial (on fait pour cela
// la supposition que les transformers n'apportent pas de modification au typage)
// Voir https://zod.dev/?id=type-inference
export type ParsedZodBsffTransporter = z.output<
  typeof rawBsffTransporterSchema
>;

const refinedBsffTransporterSchema = rawBsffTransporterSchema.superRefine(
  validateTransporterPlates
);

export const transformedBsffTransporterSchema = refinedBsffTransporterSchema
  .transform(updateTransporterRecepisse)
  .transform(sirenifyBsffTransporter);
