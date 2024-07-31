import { z } from "zod";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { BsffPackagingType, BsffType } from "@prisma/client";

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
import { sirenifyBsff, sirenifyBsffTransporter } from "./sirenify";
import {
  checkAndSetPreviousPackagings,
  updateTransporterRecepisse
} from "./transformers";
import { updateTransportersRecepisse } from "../../../common/validation/zod/transformers";
import {
  CompanyRole,
  rawTransporterSchema,
  siretSchema
} from "../../../common/validation/zod/schema";

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
    bsffId: z.string().nullish()
  })
  .merge(rawTransporterSchema);

const rawBsffPackagingSchema = z.object({
  id: z.string().nullish(),
  type: z.nativeEnum(BsffPackagingType),
  other: z.string().nullish(),
  volume: z
    .number()
    .nonnegative("Conditionnements : le volume doit être supérieur à 0")
    .nullish(),
  weight: weightSchema(WeightUnits.Kilogramme).nonnegative(
    "Conditionnements : le poids doit être supérieur à 0"
  ),
  emissionNumero: z.string(),
  numero: z
    .string({
      required_error: "Conditionnements : le numéro d'identification est requis"
    })
    .min(1, "Conditionnements : le numéro d'identification est requis"),
  previousPackagings: z.string().array().nullish(),
  acceptationSignatureDate: z.coerce.date().nullish(),
  operationSignatureDate: z.coerce.date().nullish()
});

const rawBsffSchema = z.object({
  id: z.string().default(() => getReadableId(ReadableIdPrefix.FF)),
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
  emitterCompanyName: z.string().nullish(),
  emitterCompanySiret: siretSchema(CompanyRole.Emitter).nullish(),
  emitterCompanyAddress: z.string().nullish(),
  emitterCompanyContact: z.string().nullish(),
  emitterCompanyPhone: z.string().nullish(),
  emitterCompanyMail: z.string().email("E-mail émetteur invalide").nullish(),
  emitterCustomInfo: z.string().nullish(),
  emitterEmissionSignatureAuthor: z.string().nullish(),
  emitterEmissionSignatureDate: z.coerce.date().nullish(),
  wasteCode: ZodWasteCodeEnum,
  wasteAdr: z.string().nullish(),
  weightValue: weightSchema(WeightUnits.Kilogramme)
    .nonnegative("Le poids doit être supérieur à 0")
    .nullish(),
  weightIsEstimate: z
    .boolean()
    .nullish()
    .transform(v => Boolean(v)),
  wasteDescription: z.string().nullish(),
  transporterTransportSignatureDate: z.coerce.date().nullish(),
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
  destinationCap: z.string().nullish(),
  destinationReceptionDate: z.coerce.date().nullish(),
  destinationReceptionSignatureAuthor: z.string().nullish(),
  destinationReceptionSignatureDate: z.coerce.date().nullish(),
  destinationPlannedOperationCode: ZodOperationEnum,
  detenteurCompanySirets: z.array(z.string()).optional(),
  transportersOrgIds: z.array(z.string()).optional(),
  transporters: z
    .array(rawBsffTransporterSchema)
    .max(5, "Vous ne pouvez pas ajouter plus de 5 transporteurs")
    .optional(),
  packagings: z.array(rawBsffPackagingSchema).nullish(),
  ficheInterventions: z.string().array().nullish(),
  forwarding: z.array(z.string()).nullish(),
  repackaging: z
    .array(z.string())
    // .max(
    //   1,
    //   "Vous ne pouvez saisir qu'un seul contenant lors d'une opération de reconditionnement"
    // )
    .nullish(),
  grouping: z.array(z.string()).nullish()
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
  .superRefine(checkWeights);

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
    .transform(sirenifyBsff(context))
    .transform(updateTransportersRecepisse)
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

export const transformedBsffTransporterSchema = rawBsffTransporterSchema
  .transform(updateTransporterRecepisse)
  .transform(sirenifyBsffTransporter);
