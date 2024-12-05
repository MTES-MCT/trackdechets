import { OperationMode, WasteAcceptationStatus } from "@prisma/client";
import { z } from "zod";
import { weightSchema } from "../../../common/validation/weight";
import { WeightUnits } from "../../../common/validation";
import { ZodOperationEnum, ZodWasteCodeEnum } from "../bsff/schema";
import {
  checkAcceptationWeight,
  checkCompanies,
  checkNextDestinationWhenFinalOperation,
  checkOperationMode,
  checkRequiredFields
} from "./refinement";
import { BsffPackagingValidationContext } from "./types";
import { sirenifyBsffPackaging } from "./sirenify";
import {
  CompanyRole,
  foreignVatNumberSchema,
  siretSchema
} from "../../../common/validation/zod/schema";

const rawBsffPackagingSchema = z.object({
  numero: z
    .string({
      required_error: "Le numéro de contenant ne peut pas être nul ou vide"
    })
    .optional(),
  acceptationDate: z.coerce.date().nullish(),
  acceptationRefusalReason: z.string().nullish(),
  acceptationStatus: z
    .nativeEnum(WasteAcceptationStatus)
    .refine(
      status => status !== "PARTIALLY_REFUSED",
      "Le refus partiel n'est pas autorisé dans le cas d'un BSFF"
    )
    .nullish(),
  acceptationWeight: weightSchema(WeightUnits.Kilogramme)
    .nonnegative(
      "Conditionnements : le poids à l'acceptation " +
        "doit être supérieur ou égale à 0"
    )
    .nullish(),
  acceptationWasteCode: ZodWasteCodeEnum,
  acceptationWasteDescription: z.string().nullish(),
  acceptationSignatureAuthor: z.string().nullish(),
  acceptationSignatureDate: z.coerce.date().nullish(),
  operationDate: z.coerce.date().nullish(),
  operationNoTraceability: z.coerce.boolean().nullish(),
  operationCode: ZodOperationEnum,
  operationMode: z.nativeEnum(OperationMode).nullish(),
  operationDescription: z.string().nullish(),
  operationSignatureAuthor: z.string().nullish(),
  operationSignatureDate: z.coerce.date().nullish(),
  operationNextDestinationPlannedOperationCode: ZodOperationEnum,
  operationNextDestinationCap: z.string().nullish(),
  operationNextDestinationCompanyName: z.string().nullish(),
  operationNextDestinationCompanySiret: siretSchema(
    CompanyRole.NextDestination
  ).nullish(),
  operationNextDestinationCompanyVatNumber: foreignVatNumberSchema(
    CompanyRole.NextDestination
  ).nullish(),
  operationNextDestinationCompanyAddress: z.string().nullish(),
  operationNextDestinationCompanyContact: z.string().nullish(),
  operationNextDestinationCompanyPhone: z.string().nullish(),
  operationNextDestinationCompanyMail: z
    .string()
    .email("E-mail destination ultérieure invalide")
    .nullish()
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

const refinedSchema = rawBsffPackagingSchema
  .superRefine(checkOperationMode)
  .superRefine(checkAcceptationWeight)
  .superRefine(checkNextDestinationWhenFinalOperation);

/**
 * Modification du schéma Zod pour appliquer des tranformations et
 * des vérifications **synchrones** qui nécessite de connaitre le contexte d'appel.
 *
 * Exemple : pour valider les champs requis dans une mutation de signature,
 * je dois connaitre le type de signature.
 */
export const contextualBsffPackagingSchema = (
  context: BsffPackagingValidationContext
) => {
  return refinedSchema.superRefine(checkRequiredFields(context));
};

/**
 * Modification du schéma Zod pour appliquer des tranformations et
 * des vérifications **asynchrones** qui nécessite de connaitre le contexte d'appel.
 */
export const contextualBsffPackagingSchemaAsync = (
  context: BsffPackagingValidationContext
) => {
  return refinedSchema
    .superRefine(checkCompanies)
    .transform(sirenifyBsffPackaging)
    .superRefine(checkRequiredFields(context));
};
