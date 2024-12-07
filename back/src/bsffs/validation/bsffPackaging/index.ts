import { BsffPackaging } from "@prisma/client";
import {
  ZodBsffPackaging,
  contextualBsffPackagingSchema,
  contextualBsffPackagingSchemaAsync
} from "./schema";
import { BsffPackagingValidationContext } from "./types";
import {
  getCurrentSignatureType,
  graphQlInputToZodBsffPackaging,
  prismaToZodBsffPackaging
} from "./helpers";
import { checkBsffPackagingSealedFields } from "./rules";
import { UpdateBsffPackagingInput } from "@td/codegen-back";

/**
 * Wrapper autour de `parseBsffPackagingAsync` qui peut être appelé
 * dans la mutation updateBsffPackaging pour fusionner les données stockées
 * en base et les données de l'input. Un check additionnel permet
 * de vérifier qu'on n'est pas en train de modifier des données verrouillées
 * par signature.
 */
export async function mergeInputAndParseBsffPackagingAsync(
  // BsffPackaging déjà stocké en base de données.
  persisted: BsffPackaging,
  // Données entrantes provenant de la couche GraphQL.
  input: UpdateBsffPackagingInput,
  context: BsffPackagingValidationContext
) {
  const zodPersisted = prismaToZodBsffPackaging(persisted);
  const zodInput = await graphQlInputToZodBsffPackaging(input);
  const bsffPackaging: ZodBsffPackaging = {
    ...zodPersisted,
    ...zodInput
  };

  // Calcule la signature courante à partir des données si elle n'est
  // pas fourni via le contexte
  const currentSignatureType =
    context.currentSignatureType ?? getCurrentSignatureType(zodPersisted);

  const contextWithSignature = {
    ...context,
    currentSignatureType
  };

  // Vérifie que l'on n'est pas en train de modifier des données
  // vérrouillées par signature.
  const updatedFields = await checkBsffPackagingSealedFields(
    zodPersisted,
    bsffPackaging,
    contextWithSignature
  );

  const parsedBsffPackaging = await parseBsffPackagingAsync(
    bsffPackaging,
    contextWithSignature
  );

  return { parsedBsffPackaging, updatedFields };
}

/**
 * Fonction permettant de valider et parser un BsffPackaging dans son contexte d'appel.
 * Les données provenant d'un input GraphQL et / ou de la base de données
 * doivent être converties au préalable au format attendu par zod (`ZodBsffPackaging`).
 */
export async function parseBsffPackagingAsync(
  bsffPackaging: ZodBsffPackaging,
  context: BsffPackagingValidationContext = {}
) {
  const schema = contextualBsffPackagingSchemaAsync(context);
  return schema.parseAsync(bsffPackaging);
}

/**
 * Version synchrone de `parseBsffPackagingAsync` qui ne prend pas en compte les
 * refinements et transformers qui se jouent en asynchrone (sirenify, etc).
 */
export function parseBsffPackaging(
  bsffPackaging: ZodBsffPackaging,
  context: BsffPackagingValidationContext = {}
) {
  const schema = contextualBsffPackagingSchema(context);
  return schema.parse(bsffPackaging);
}
