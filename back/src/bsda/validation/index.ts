import type { BsdaInput } from "@td/codegen-back";
import {
  getCurrentSignatureType,
  graphQlInputToZodBsda,
  prismaToZodBsda
} from "./helpers";
import { checkBsdaSealedFields } from "./rules";
import { contextualSchema } from "./schema";
import { ZodBsdaTransporter, transformedBsdaTransporterSchema } from "./schema";
import { ZodBsda, contextualSchemaAsync } from "./schema";
import { BsdaValidationContext, PrismaBsdaForParsing } from "./types";
import { BsdaType } from "@td/prisma";

/**
 * Wrapper autour de `parseBsdaAsync` qui peut être appelé
 * dans la mutation updateBsda pour fusionner les données stockées
 * en base et les données de l'input. Un check additionnel permet
 * de vérifier qu'on n'est pas en train de modifier des données verrouillées
 * par signature.
 */
export async function mergeInputAndParseBsdaAsync(
  // BSDA déjà stockée en base de données.
  persisted: PrismaBsdaForParsing,
  // Données entrantes provenant de la couche GraphQL.
  input: BsdaInput,
  context: BsdaValidationContext
) {
  const zodPersisted = prismaToZodBsda(persisted);
  const zodInput = await graphQlInputToZodBsda(input);

  const bsda: ZodBsda = {
    ...zodPersisted,
    ...zodInput
  };

  // La fusion des transporteurs est un peu plus compliquée à cause de l'utilisation
  // possible du du champ `BsdaInput.transporter (rétro-comptabilité avec l'API
  // BSDA pré multi-modal)
  if (input.transporter === null) {
    // On supprime le premier transporteur en gardant les suivants (s'ils existent)
    bsda.transporters = (zodPersisted.transporters ?? []).slice(1);
  } else if (
    input.transporter &&
    zodPersisted.transporters &&
    zodPersisted.transporters.length > 0
  ) {
    // On modifie les données du 1er transporteur
    bsda.transporters = zodPersisted.transporters.map((t, idx) => {
      if (idx === 0) {
        return { ...t, ...bsda.transporters![0] };
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

  // Si le type du BSDA n'est pas un BSD de collecte, on réinitialise les champs liés au point de collecte
  if (bsda.type !== BsdaType.GATHERING) {
    bsda.emitterPickupSiteName = null;
    bsda.emitterPickupSiteAddress = null;
    bsda.emitterPickupSiteCity = null;
    bsda.emitterPickupSitePostalCode = null;
    bsda.emitterPickupSiteInfos = null;
  }

  // Vérifie que l'on n'est pas en train de modifier des données
  // vérrouillées par signature.
  const updatedFields = await checkBsdaSealedFields(
    zodPersisted,
    bsda,
    contextWithSignature
  );

  const parsedBsda = await parseBsdaAsync(bsda, contextWithSignature);

  return { parsedBsda, updatedFields };
}

/**
 * Fonction permettant de valider et parser un BSDA dans son contexte d'appel.
 * Les données provenant d'un input GraphQL et / ou de la base de données
 * doivent être converties au préalable au format attendu par zod (`ZodBsda`).
 */
export async function parseBsdaAsync(
  bsda: ZodBsda,
  context: BsdaValidationContext
) {
  const schema = contextualSchemaAsync(context);
  return schema.parseAsync(bsda);
}
/**
 * Version synchrone de `parseBsdaAsync` qui ne prend pas en compte les
 * refinements et transformers qui se jouent en asynchrone (sirenify, etc).
 */

export function parseBsda(bsda: ZodBsda, context: BsdaValidationContext) {
  const schema = contextualSchema(context);
  return schema.parse(bsda);
}

/**
 * Fonction permettant de valider et parser un BsdaTransporter dans les
 * mutations `createBsdaTransporter` et `updateBsdaTransporter`
 */
export function parseBsdaTransporterAsync(transporter: ZodBsdaTransporter) {
  return transformedBsdaTransporterSchema.parseAsync(transporter);
}
