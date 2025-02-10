import type { BsvhuInput } from "@td/codegen-back";
import {
  getCurrentSignatureType,
  graphQlInputToZodBsvhu,
  prismaToZodBsvhu
} from "./helpers";
import { checkBsvhuSealedFields } from "./rules";
import {
  ParsedZodBsvhu,
  ZodBsvhu,
  contextualBsvhuSchema,
  contextualBsvhuSchemaAsync
} from "./schema";
import { BsvhuValidationContext, PrismaBsvhuForParsing } from "./types";

/**
 * Wrapper autour de `parseBsvhuAsync` qui peut être appelé
 * dans la mutation updateBsvhu pour fusionner les données stockées
 * en base et les données de l'input. Un check additionnel permet
 * de vérifier qu'on n'est pas en train de modifier des données verrouillées
 * par signature.
 */
export async function mergeInputAndParseBsvhuAsync(
  // Bsvhu déjà stocké en base de données.
  persisted: PrismaBsvhuForParsing,
  // Données entrantes provenant de la couche GraphQL.
  input: BsvhuInput,
  context: BsvhuValidationContext
) {
  const zodPersisted = prismaToZodBsvhu(persisted);
  const zodInput = graphQlInputToZodBsvhu(input);

  const bsvhu: ZodBsvhu = {
    ...zodPersisted,
    ...zodInput
  };

  // keep address fields coherent while we have both address and street/city/postalCode
  // if the address changes, and the street/city/postalCode is not in input, clean it
  // if street/city/postalCode changes, cleanup address field.
  if (
    zodInput.emitterCompanyAddress !== undefined &&
    zodInput.emitterCompanyAddress !== zodPersisted.emitterCompanyAddress
  ) {
    if (!zodInput.emitterCompanyStreet) {
      bsvhu.emitterCompanyStreet = null;
    }
    if (!zodInput.emitterCompanyCity) {
      bsvhu.emitterCompanyCity = null;
    }
    if (!zodInput.emitterCompanyPostalCode) {
      bsvhu.emitterCompanyPostalCode = null;
    }
  } else if (
    ((zodInput.emitterCompanyStreet !== undefined &&
      zodInput.emitterCompanyStreet !== zodPersisted.emitterCompanyStreet) ||
      (zodInput.emitterCompanyCity !== undefined &&
        zodInput.emitterCompanyCity !== zodPersisted.emitterCompanyCity) ||
      (zodInput.emitterCompanyPostalCode !== undefined &&
        zodInput.emitterCompanyPostalCode !==
          zodPersisted.emitterCompanyPostalCode)) &&
    !zodInput.emitterCompanyAddress
  ) {
    bsvhu.emitterCompanyAddress = null;
  }

  // Calcule la signature courante à partir des données si elle n'est
  // pas fournie via le contexte
  const currentSignatureType =
    context.currentSignatureType ?? getCurrentSignatureType(zodPersisted);

  const contextWithSignature = {
    ...context,
    currentSignatureType
  };

  // Vérifie que l'on n'est pas en train de modifier des données
  // verrouillées par signature.
  const updatedFields = await checkBsvhuSealedFields(
    zodPersisted,
    bsvhu,
    contextWithSignature
  );

  const parsedBsvhu = await parseBsvhuAsync(bsvhu, contextWithSignature);

  return { parsedBsvhu, updatedFields };
}

/**
 * Fonction permettant de valider et parser un BSVHU dans son contexte d'appel.
 * Les données provenant d'un input GraphQL et / ou de la base de données
 * doivent être converties au préalable au format attendu par zod (`ZodBsvhu`).
 */
export async function parseBsvhuAsync(
  bsvhu: ZodBsvhu,
  context: BsvhuValidationContext = {}
): Promise<ParsedZodBsvhu> {
  const schema = contextualBsvhuSchemaAsync(context);
  return schema.parseAsync(bsvhu);
}

/**
 * Version synchrone de `parseBsvhuAsync` qui ne prend pas en compte les
 * refinements et transformers qui se jouent en asynchrone (sirenify, etc).
 */
export function parseBsvhu(
  bsvhu: ZodBsvhu,
  context: BsvhuValidationContext = {}
): ParsedZodBsvhu {
  const schema = contextualBsvhuSchema(context);
  return schema.parse(bsvhu);
}
