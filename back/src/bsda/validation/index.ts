import { BsdaInput } from "../../generated/graphql/types";
import {
  getCurrentSignatureType,
  graphQlInputToZodBsda,
  prismaToZodBsda
} from "./helpers";
import { checkSealedFields } from "./rules";
import { contextualSchema } from "./schema";
import { ParsedZodBsda } from "./schema";
import { ZodBsda, contextualSchemaAsync } from "./schema";
import { BsdaValidationContext, PrismaBsdaForParsing } from "./types";

/**
 * Wrapper autour de `parseBsdaAsync` qui peut être appelé
 * dans la mutation updateBsda pour fusionner les données stockées
 * en base et les données de l'input. Un check additionnel permet
 * de vérifier qu'on n'est pas en train de modifier des données verrouillées
 * par signature.
 */
export async function mergeInputAndParseBsdaAsync(
  // BSDA déjà stockée en base de données.
  // Sera undefined dans le cas d'une création.
  persisted: PrismaBsdaForParsing,
  // Données entrantes provenant de la couche GraphQL.
  // Sera undefined dans le cas d'une signature, duplication, publication.
  input: BsdaInput,
  context: BsdaValidationContext
) {
  const zodPersisted = persisted ? prismaToZodBsda(persisted) : null;
  const zodInput = input ? graphQlInputToZodBsda(input) : null;

  const bsda: ZodBsda = {
    ...(zodPersisted ?? {}),
    ...(zodInput ?? {})
  };

  // Calcule la signature courante à partir des données si elle n'est
  // pas fourni via le contexte
  const currentSignatureType =
    context.currentSignatureType ?? getCurrentSignatureType(bsda);

  const contextWithSignature = {
    ...context,
    currentSignatureType
  };

  if (zodInput && zodPersisted) {
    // Vérifie que l'on n'est pas en train de modifier des données
    // vérrouillées par signature.
    await checkSealedFields(zodPersisted, zodInput, contextWithSignature);
  }

  return parseBsdaAsync(bsda, contextWithSignature);
}

/**
 * Fonction permettant de valider et parser un BSDA dans son contexte d'appel.
 * Les données provenant d'un input GraphQL et / ou de la base de données
 * doivent être converties au préalable au format attendu par zod (`ZodBsda`).
 * La fonction `parseBsdaInContext` permet de gérer cette conversion.
 */

export async function parseBsdaAsync(
  bsda: ZodBsda,
  context: BsdaValidationContext
) {
  const schema = contextualSchemaAsync(context);
  const parsedBsda = await schema.parseAsync(bsda);
  return toMultiModalBsda(parsedBsda);
}
/**
 * Version synchrone de `parseBsdaAsync` qui ne prend pas en compte les
 * refinements et transformers qui se jouent en asynchrone (sirenify, etc).
 */

export function parseBsda(bsda: ZodBsda, context: BsdaValidationContext) {
  const schema = contextualSchema(context);
  const parsedBsda = schema.parse(bsda);
  return toMultiModalBsda(parsedBsda);
}
/**
 * Couche de compatibilité temporaire entre les données transporteurs
 * Zod ("à plat") et les données transporteurs en base de données (table séparée).
 * Va disparaitre avec l'implémentation du multi-modal
 */

export function toMultiModalBsda(parsedBsda: ParsedZodBsda) {
  const {
    transporterCompanySiret,
    transporterCompanyName,
    transporterCompanyVatNumber,
    transporterCompanyAddress,
    transporterCompanyContact,
    transporterCompanyPhone,
    transporterCompanyMail,
    transporterCustomInfo,
    transporterRecepisseIsExempted,
    transporterRecepisseNumber,
    transporterRecepisseDepartment,
    transporterRecepisseValidityLimit,
    transporterTransportMode,
    transporterTransportPlates,
    transporterTransportTakenOverAt,
    transporterTransportSignatureAuthor,
    transporterTransportSignatureDate,
    transporterId,
    ...rest
  } = parsedBsda;

  // Au niveau du schéma Zod, tout se passe comme si les données de transport
  // était encore "à plat" avec un seul transporteur (en attendant l'implémentation du multi-modal)
  // On renvoie séparement les données du bsda et les données du transporteur
  // car elles font ensuite l'objet de traitement séparé pour construire les payloads de création / update
  // en base de données
  return {
    bsda: { ...rest, transporterTransportSignatureDate },
    transporter: {
      id: transporterId,
      transporterCompanySiret,
      transporterCompanyName,
      transporterCompanyVatNumber,
      transporterCompanyAddress,
      transporterCompanyContact,
      transporterCompanyPhone,
      transporterCompanyMail,
      transporterCustomInfo,
      transporterRecepisseIsExempted,
      transporterRecepisseNumber,
      transporterRecepisseDepartment,
      transporterRecepisseValidityLimit,
      transporterTransportMode,
      transporterTransportPlates,
      transporterTransportTakenOverAt,
      transporterTransportSignatureAuthor,
      transporterTransportSignatureDate
    }
  };
}
