import type { BsdasriInput } from "@td/codegen-back";
import {
  getCurrentSignatureType,
  graphQlInputToZodBsdasri,
  prismaToZodBsdasri
} from "./helpers";
import { checkBsdasriSealedFields } from "./rules";
import {
  ParsedZodBsdasri,
  ZodBsdasri,
  contextualBsdasriSchema,
  contextualBsdasriSchemaAsync
} from "./schema";
import { BsdasriValidationContext, PrismaBsdasriForParsing } from "./types";

/**
 * Wrapper autour de `parseBsdasriAsync` qui peut être appelé
 * dans la mutation updateBsdasri pour fusionner les données stockées
 * en base et les données de l'input. Un check additionnel permet
 * de vérifier qu'on n'est pas en train de modifier des données verrouillées
 * par signature.
 */
export async function mergeInputAndParseBsdasriAsync(
  // Bsdasri déjà stocké en base de données.
  persisted: PrismaBsdasriForParsing,
  // Données entrantes provenant de la couche GraphQL.
  input: BsdasriInput,
  context: BsdasriValidationContext
) {
  const zodPersisted = prismaToZodBsdasri(persisted);
  const zodInput = graphQlInputToZodBsdasri(input);

  const bsdasri: ZodBsdasri = {
    ...zodPersisted,
    ...zodInput
  };

  // keep address fields coherent while we have both address and street/city/postalCode
  // if the address changes, and the street/city/postalCode is not in input, clean it
  // if street/city/postalCode changes, cleanup address field.

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
  const updatedFields = await checkBsdasriSealedFields(
    zodPersisted,
    bsdasri,
    contextWithSignature
  );

  const parsedBsdasri = await parseBsdasriAsync(bsdasri, contextWithSignature);

  return { parsedBsdasri, updatedFields };
}

/**
 * Fonction permettant de valider et parser un BSDASRI dans son contexte d'appel.
 * Les données provenant d'un input GraphQL et / ou de la base de données
 * doivent être converties au préalable au format attendu par zod (`ZodBsdasri`).
 */
export async function parseBsdasriAsync(
  bsdasri: ZodBsdasri,
  context: BsdasriValidationContext = {}
): Promise<ParsedZodBsdasri> {
  const schema = contextualBsdasriSchemaAsync(context);
  return schema.parseAsync(bsdasri);
}

/**
 * Version synchrone de `parseBsdasriAsync` qui ne prend pas en compte les
 * refinements et transformers qui se jouent en asynchrone (sirenify, etc).
 */
export function parseBsdasri(
  bsdasri: ZodBsdasri,
  context: BsdasriValidationContext = {}
): ParsedZodBsdasri {
  const schema = contextualBsdasriSchema(context);
  return schema.parse(bsdasri);
}
