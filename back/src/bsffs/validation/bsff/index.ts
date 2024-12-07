import { BsffInput } from "@td/codegen-back";
import {
  getCurrentSignatureType,
  graphQlInputToZodBsff,
  prismaToZodBsff
} from "./helpers";
import { checkBsffSealedFields } from "./rules";
import {
  ZodBsff,
  ZodBsffTransporter,
  contextualBsffSchema,
  contextualBsffSchemaAsync,
  transformedBsffTransporterSchema
} from "./schema";
import { BsffValidationContext, PrismaBsffForParsing } from "./types";

/**
 * Wrapper autour de `parseBsffAsync` qui peut être appelé
 * dans la mutation updateBsff pour fusionner les données stockées
 * en base et les données de l'input. Un check additionnel permet
 * de vérifier qu'on n'est pas en train de modifier des données verrouillées
 * par signature.
 */
export async function mergeInputAndParseBsffAsync(
  // BSFF déjà stockée en base de données.
  persisted: PrismaBsffForParsing,
  // Données entrantes provenant de la couche GraphQL.
  input: BsffInput,
  context: BsffValidationContext
) {
  const zodPersisted = prismaToZodBsff(persisted);
  const zodInput = await graphQlInputToZodBsff(input);

  const bsff: ZodBsff = {
    ...zodPersisted,
    ...zodInput
  };

  // La fusion des transporteurs est un peu plus compliquée à cause de l'utilisation
  // possible du du champ `BsffInput.transporter (rétro-comptabilité avec l'API
  // BSFF pré multi-modal)
  if (input.transporter === null) {
    // On supprime le premier transporteur en gardant les suivants (s'ils existent)
    bsff.transporters = (zodPersisted.transporters ?? []).slice(1);
  } else if (
    input.transporter &&
    zodPersisted.transporters &&
    zodPersisted.transporters.length > 0
  ) {
    // On modifie les données du 1er transporteur
    bsff.transporters = zodPersisted.transporters.map((t, idx) => {
      if (idx === 0) {
        return { ...t, ...bsff.transporters![0] };
      }
      return t;
    });
  }

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
  const updatedFields = await checkBsffSealedFields(
    {
      ...zodPersisted,
      // compare uniquement aux infos de contenant qui peuvent
      // être modifiés via `updateBsff`
      packagings: zodPersisted.packagings?.map(p => ({
        type: p.type,
        other: p.other,
        volume: p.volume,
        numero: p.numero,
        emissionNumero: p.numero,
        weight: p.weight
      }))
    },
    bsff,
    contextWithSignature
  );

  const parsedBsff = await parseBsffAsync(bsff, contextWithSignature);

  return { parsedBsff, updatedFields };
}

/**
 * Fonction permettant de valider et parser un BSFF dans son contexte d'appel.
 * Les données provenant d'un input GraphQL et / ou de la base de données
 * doivent être converties au préalable au format attendu par zod (`ZodBsff`).
 */
export async function parseBsffAsync(
  bsff: ZodBsff,
  context: BsffValidationContext = {}
) {
  const schema = contextualBsffSchemaAsync(context);
  return schema.parseAsync(bsff);
}

/**
 * Version synchrone de `parseBsffAsync` qui ne prend pas en compte les
 * refinements et transformers qui se jouent en asynchrone (sirenify, etc).
 */
export function parseBsff(bsff: ZodBsff, context: BsffValidationContext = {}) {
  const schema = contextualBsffSchema(context);
  return schema.parse(bsff);
}

/**
 * Fonction permettant de valider et parser un BsffTransporter dans les
 * mutations `createBsffTransporter` et `updateBsffTransporter`
 */
export function parseBsffTransporterAsync(transporter: ZodBsffTransporter) {
  return transformedBsffTransporterSchema.parseAsync(transporter);
}
