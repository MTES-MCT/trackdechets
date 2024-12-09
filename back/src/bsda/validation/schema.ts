import {
  BsdaConsistence,
  BsdaType,
  OperationMode,
  WasteAcceptationStatus
} from "@prisma/client";
import { z } from "zod";
import { BSDA_WASTE_CODES } from "@td/constants";
import {
  intermediariesRefinement,
  intermediarySchema
} from "../../common/validation/intermediaries";
import getReadableId, { ReadableIdPrefix } from "../../forms/readableId";
import { OPERATIONS, WORKER_CERTIFICATION_ORGANISM } from "./constants";
import { BsdaValidationContext } from "./types";
import {
  checkCompanies,
  checkNoBothGroupingAndForwarding,
  checkNoEmitterWhenPrivateIndividual,
  checkNoTransporterWhenCollection2710,
  checkNoWorkerWhenCollection2710,
  checkNoWorkerWhenWorkerIsDisabled,
  checkOperationIsAfterReception,
  checkOperationMode,
  checkRequiredFields,
  checkTransporters,
  checkWorkerSubSectionThree,
  validateDestination,
  validatePreviousBsdas
} from "./refinements";
import {
  fillIntermediariesOrgIds,
  fillWasteConsistenceWhenForwarding,
  emptyWorkerCertificationWhenWorkerIsDisabled,
  updateTransporterRecepisse,
  runTransformers
} from "./transformers";
import { sirenifyBsdaTransporter } from "./sirenify";
import {
  CompanyRole,
  foreignVatNumberSchema,
  rawTransporterSchema,
  siretSchema
} from "../../common/validation/zod/schema";

const ZodBsdaPackagingEnum = z.enum([
  "BIG_BAG",
  "CONTENEUR_BAG",
  "DEPOT_BAG",
  "OTHER",
  "PALETTE_FILME",
  "SAC_RENFORCE"
]);

export type ZodBsdaPackagingEnum = z.infer<typeof ZodBsdaPackagingEnum>;

const ZodWasteCodeEnum = z.enum(BSDA_WASTE_CODES).nullish();

export type ZodWasteCodeEnum = z.infer<typeof ZodWasteCodeEnum>;

const ZodOperationEnum = z.enum(OPERATIONS).nullish();

export type ZodOperationEnum = z.infer<typeof ZodOperationEnum>;

const ZodWorkerCertificationOrganismEnum = z
  .enum(WORKER_CERTIFICATION_ORGANISM)
  .nullish();

export type ZodWorkerCertificationOrganismEnum = z.infer<
  typeof ZodWorkerCertificationOrganismEnum
>;

export const bsdaPackagingSchema = z
  .object({
    type: ZodBsdaPackagingEnum.nullish(),
    other: z.string().nullish(),
    quantity: z.number().nullish()
  })
  .refine(val => val.type !== "OTHER" || !!val.other, {
    message:
      "Vous devez saisir la description du conditionnement quand le type de conditionnement est 'Autre'"
  });

const rawBsdaTransporterSchema = z
  .object({
    bsdaId: z.string().nullish()
  })
  .merge(rawTransporterSchema);

/**
 * Schéma de validation Zod de base permettant pour chaque champ de :
 * - définir le typage attendu
 * - définir des règles de validation
 * - fournir des valeurs par défaut
 * - appliquer des transformations et des refinements
 * dont le calcul se fait sur un seul champ.
 */
export const rawBsdaSchema = z.object({
  id: z.string().default(() => getReadableId(ReadableIdPrefix.BSDA)),
  isDraft: z.boolean().default(false),
  isDeleted: z.boolean().default(false),
  type: z.nativeEnum(BsdaType).default(BsdaType.OTHER_COLLECTIONS),
  emitterIsPrivateIndividual: z.coerce
    .boolean()
    .nullish()
    .transform(v => Boolean(v)),
  emitterCompanyName: z.string().nullish(),
  emitterCompanySiret: siretSchema(CompanyRole.Emitter).nullish(),
  emitterCompanyAddress: z.string().nullish(),
  emitterCompanyContact: z.string().nullish(),
  emitterCompanyPhone: z.string().nullish(),
  emitterCompanyMail: z.string().nullish(),
  emitterCustomInfo: z.string().nullish(),
  emitterPickupSiteName: z.string().nullish(),
  emitterPickupSiteAddress: z.string().nullish(),
  emitterPickupSiteCity: z.string().nullish(),
  emitterPickupSitePostalCode: z.string().nullish(),
  emitterPickupSiteInfos: z.string().nullish(),
  emitterEmissionSignatureAuthor: z.string().nullish(),
  emitterEmissionSignatureDate: z.coerce.date().nullish(),
  ecoOrganismeName: z.string().nullish(),
  ecoOrganismeSiret: siretSchema(CompanyRole.EcoOrganisme).nullish(),
  wasteCode: ZodWasteCodeEnum,
  wasteFamilyCode: z.string().nullish(),
  wasteMaterialName: z.string().nullish(),
  wasteConsistence: z.nativeEnum(BsdaConsistence).nullish(),
  wasteSealNumbers: z.array(z.string()).default([]),
  wasteAdr: z.string().nullish(),
  wastePop: z.coerce
    .boolean()
    .nullish()
    .transform(v => Boolean(v)),
  packagings: z
    .array(bsdaPackagingSchema)
    .nullish()
    .default([])
    .transform(val => (val == null ? [] : val)),
  weightIsEstimate: z.coerce
    .boolean()
    .nullish()
    .transform(v => Boolean(v)),
  weightValue: z.number().nullish(),
  brokerCompanyName: z.string().nullish(),
  brokerCompanySiret: siretSchema(CompanyRole.Broker).nullish(),
  brokerCompanyAddress: z.string().nullish(),
  brokerCompanyContact: z.string().nullish(),
  brokerCompanyPhone: z.string().nullish(),
  brokerCompanyMail: z.string().nullish(),
  brokerRecepisseNumber: z.string().nullish(),
  brokerRecepisseDepartment: z.string().nullish(),
  brokerRecepisseValidityLimit: z.coerce.date().nullish(),
  destinationCompanyName: z.string().nullish(),
  destinationCompanySiret: siretSchema(CompanyRole.Destination).nullish(),
  destinationCompanyAddress: z.string().nullish(),
  destinationCompanyContact: z.string().nullish(),
  destinationCompanyPhone: z.string().nullish(),
  destinationCompanyMail: z.string().nullish(),
  destinationCap: z.string().nullish(),
  destinationPlannedOperationCode: ZodOperationEnum,
  destinationCustomInfo: z.string().nullish(),
  destinationReceptionDate: z.coerce.date().nullish(),
  destinationReceptionWeight: z.number().nullish(),
  destinationReceptionAcceptationStatus: z
    .nativeEnum(WasteAcceptationStatus)
    .nullish(),
  destinationReceptionRefusalReason: z.string().nullish(),
  destinationOperationCode: ZodOperationEnum.nullish(),
  destinationOperationMode: z.nativeEnum(OperationMode).nullish(),
  destinationOperationDescription: z.string().nullish(),
  destinationOperationDate: z.coerce
    .date()
    .nullish()
    .refine(val => !val || val < new Date(), {
      message: "La date d'opération ne peut pas être dans le futur."
    }),
  destinationOperationSignatureAuthor: z.string().nullish(),
  destinationOperationSignatureDate: z.coerce.date().nullish(),
  destinationOperationNextDestinationCompanySiret: siretSchema(
    CompanyRole.NextDestination
  ).nullish(),
  destinationOperationNextDestinationCompanyVatNumber: foreignVatNumberSchema(
    CompanyRole.NextDestination
  ).nullish(),
  destinationOperationNextDestinationCompanyName: z.string().nullish(),
  destinationOperationNextDestinationCompanyAddress: z.string().nullish(),
  destinationOperationNextDestinationCompanyContact: z.string().nullish(),
  destinationOperationNextDestinationCompanyPhone: z.string().nullish(),
  destinationOperationNextDestinationCompanyMail: z.string().nullish(),
  destinationOperationNextDestinationCap: z.string().nullish(),
  destinationOperationNextDestinationPlannedOperationCode: z.string().nullish(),
  workerIsDisabled: z.coerce
    .boolean()
    .default(false)
    .nullish()
    .transform(v => Boolean(v)),
  workerCompanyName: z.string().nullish(),
  workerCompanySiret: siretSchema(CompanyRole.Worker).nullish(),
  workerCompanyAddress: z.string().nullish(),
  workerCompanyContact: z.string().nullish(),
  workerCompanyPhone: z.string().nullish(),
  workerCompanyMail: z.string().nullish(),
  workerCertificationHasSubSectionFour: z.coerce
    .boolean()
    .nullish()
    .transform(v => Boolean(v)),
  workerCertificationHasSubSectionThree: z.coerce
    .boolean()
    .nullish()
    .transform(v => Boolean(v)),
  workerCertificationCertificationNumber: z.string().nullish(),
  workerCertificationValidityLimit: z.coerce.date().nullish(),
  workerCertificationOrganisation: ZodWorkerCertificationOrganismEnum,
  workerWorkHasEmitterPaperSignature: z.coerce
    .boolean()
    .nullish()
    .transform(v => Boolean(v)),
  workerWorkSignatureAuthor: z.string().nullish(),
  workerWorkSignatureDate: z.coerce.date().nullish(),
  transporters: z
    .array(rawBsdaTransporterSchema)
    .max(5, "Vous ne pouvez pas ajouter plus de 5 transporteurs")
    .optional(),
  grouping: z.array(z.string()).optional().nullish(),
  forwarding: z.string().nullish(),
  intermediaries: z
    .array(intermediarySchema)
    .nullish()
    .superRefine(intermediariesRefinement),
  intermediariesOrgIds: z.array(z.string()).optional(),
  transportersOrgIds: z.array(z.string()).optional()
});

// Type inféré par Zod - avant parsing
// Voir https://zod.dev/?id=type-inference
export type ZodBsda = z.input<typeof rawBsdaSchema>;

// Type inféré par Zod - après parsing par le schéma "brut".
// On pourra utiliser ce type en entrée et en sortie dans les refinements et
// les transformers qui arrivent après le parsing initial (on fait pour cela
// la supposition que les transformers n'apportent pas de modification au typage)
// Voir https://zod.dev/?id=type-inference
export type ParsedZodBsda = z.output<typeof rawBsdaSchema>;

/**
 * Modification du schéma Zod pour appliquer des règles de validation
 * et des vérifications **synchrones** dont le contrôle se fait sur plusieurs champs
 *
 * Exemple: vérifier que la date de l'opération est postérieure à la date de
 * la réception.
 */
export const refinedSchema = rawBsdaSchema
  .superRefine(checkOperationIsAfterReception)
  .superRefine(checkOperationMode)
  .superRefine(checkNoEmitterWhenPrivateIndividual)
  .superRefine(checkNoWorkerWhenWorkerIsDisabled)
  .superRefine(checkWorkerSubSectionThree)
  .superRefine(checkNoTransporterWhenCollection2710)
  .superRefine(checkNoWorkerWhenCollection2710)
  .superRefine(checkNoBothGroupingAndForwarding)
  .superRefine(checkTransporters);

// Transformations synchrones qui sont toujours
// joués même si `enableCompletionTransformers=false`
const transformedSyncSchema = refinedSchema
  // FIXME le calcul du champ dénormalisé `intermediariesOrgIds`
  // devrait se faire dans le repository pour s'assurer que les données restent synchro
  .transform(fillIntermediariesOrgIds)
  .transform(emptyWorkerCertificationWhenWorkerIsDisabled);

/**
 * Modification du schéma Zod pour appliquer des tranformations et
 * des vérifications **synchrones** qui nécessite de connaitre le contexte d'appel.
 *
 * Exemple : pour valider les champs requis dans une mutation de signature,
 * je dois connaitre le type de signature.
 */
export const contextualSchema = (context: BsdaValidationContext) => {
  return transformedSyncSchema.superRefine(
    // run le check sur les champs requis après les transformations
    // au cas où des transformations auto-complète certains champs
    checkRequiredFields(context)
  );
};

/**
 * Modification du schéma Zod pour appliquer des tranformations et
 * des vérifications **asynchrones** qui nécessite de connaitre le contexte d'appel.
 */
export const contextualSchemaAsync = (context: BsdaValidationContext) => {
  const schema = context.enableCompletionTransformers
    ? // Transformations asynchrones qui ne sont pas
      // `enableCompletionTransformers=false`;
      transformedSyncSchema
        .transform((bsda: ParsedZodBsda) => runTransformers(bsda, context))
        .transform(fillWasteConsistenceWhenForwarding)
    : transformedSyncSchema;

  // refinement asynchrones
  const refinedAsyncSchema = schema
    .superRefine((bsda, zodContext) =>
      checkCompanies(bsda, zodContext, context)
    )
    .superRefine(validateDestination(context))
    .superRefine(
      // run le check sur les champs requis après les transformations
      // au cas où une des transformations auto-complète certains champs
      checkRequiredFields(context)
    );

  return context.enablePreviousBsdasChecks
    ? refinedAsyncSchema.superRefine(validatePreviousBsdas)
    : refinedAsyncSchema;
};

// Type inféré par Zod - avant parsing
// Voir https://zod.dev/?id=type-inference
export type ZodBsdaTransporter = z.input<typeof rawBsdaTransporterSchema>;

// Type inféré par Zod - après parsing par le schéma "brut".
// On pourra utiliser ce type en entrée et en sortie dans les refinements et
// les transformers qui arrivent après le parsing initial (on fait pour cela
// la supposition que les transformers n'apportent pas de modification au typage)
// Voir https://zod.dev/?id=type-inference
export type ParsedZodBsdaTransporter = z.output<
  typeof rawBsdaTransporterSchema
>;

export const transformedBsdaTransporterSchema = rawBsdaTransporterSchema
  .transform(updateTransporterRecepisse)
  .transform(sirenifyBsdaTransporter);
