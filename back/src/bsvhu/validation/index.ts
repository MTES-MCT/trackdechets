import { Bsvhu } from "@prisma/client";
import { BsvhuInput } from "../../generated/graphql/types";
import {
  getCurrentSignatureType,
  graphQlInputToZodBsvhu,
  prismaToZodBsvhu
} from "./helpers";
import { checkBsvhuSealedFields } from "./rules";
import {
  ZodBsvhu,
  contextualBsvhuSchema,
  contextualBsvhuSchemaAsync
} from "./schema";
import { BsvhuValidationContext } from "./types";

/**
 * Wrapper autour de `parseBsvhuAsync` qui peut être appelé
 * dans la mutation updateBsvhu pour fusionner les données stockées
 * en base et les données de l'input. Un check additionnel permet
 * de vérifier qu'on n'est pas en train de modifier des données verrouillées
 * par signature.
 */
export async function mergeInputAndParseBsvhuAsync(
  // BSFF déjà stockée en base de données.
  persisted: Bsvhu,
  // Données entrantes provenant de la couche GraphQL.
  input: BsvhuInput,
  context: BsvhuValidationContext
) {
  const zodPersisted = prismaToZodBsvhu(persisted);
  const zodInput = await graphQlInputToZodBsvhu(input);

  const bsvhu: ZodBsvhu = {
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
) {
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
) {
  const schema = contextualBsvhuSchema(context);
  return schema.parse(bsvhu);
}
