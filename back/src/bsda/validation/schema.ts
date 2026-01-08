import {
  BsdaConsistence,
  BsdaType,
  OperationMode,
  WasteAcceptationStatus
} from "@td/prisma";
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
  validatePreviousBsdas,
  validateDestinationReceptionWeight,
  wasteAdrRefinement,
  checkDestinationReceptionRefusedWeight,
  validateReceptionOperationCode
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
import {
  validateMultiTransporterPlates,
  validateTransporterPlates
} from "../../common/validation/zod/refinement";
import { isDefinedStrict } from "../../common/helpers";
import { startOfDay, startOfDayPlusOneDay } from "../../utils";

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
    other: z.string().max(250).nullish(),
    quantity: z.number().nullish(),
    volume: z
      .number()
      .positive("Le volume doit être un nombre positif")
      .nullish(),
    identificationNumbers: z.array(z.string().max(250)).nullish()
  })
  .refine(val => val.type !== "OTHER" || !!val.other, {
    message:
      "Vous devez saisir la description du conditionnement quand le type de conditionnement est 'Autre'"
  });

const rawBsdaTransporterSchema = z
  .object({
    bsdaId: z.string().max(50).nullish()
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
  id: z
    .string()
    .max(50)
    .default(() => getReadableId(ReadableIdPrefix.BSDA)),
  // on ajoute `createdAt` au schéma de validation pour appliquer certaines
  // règles de façon contextuelles en fonction de la date de création du BSDA.
  // Cela permet de faire évoluer le schéma existant lors d'une MEP sans bloquer
  // en cours de route des bordereaux qui ont déjà été publié sur la base d'une
  // ancienne version du schéma.
  createdAt: z.date().nullish(),
  isDraft: z.boolean().default(false),
  isDeleted: z.boolean().default(false),
  type: z.nativeEnum(BsdaType).default(BsdaType.OTHER_COLLECTIONS),
  // We don't use z.coerce.boolean() because the infered input type would then be boolean only, not allowing null or undefined
  // and setting z.coerce.boolean().nullish() would have an infered output type of boolean | null | undefined instead of boolean
  emitterIsPrivateIndividual: z
    .boolean()
    .nullish()
    .transform(v => Boolean(v)),
  emitterCompanyName: z.string().max(250).nullish(),
  emitterCompanySiret: siretSchema(CompanyRole.Emitter).nullish(),
  emitterCompanyAddress: z.string().max(250).nullish(),
  emitterCompanyContact: z.string().max(250).nullish(),
  emitterCompanyPhone: z.string().max(250).nullish(),
  emitterCompanyMail: z.string().max(250).nullish(),
  emitterCustomInfo: z.string().max(250).nullish(),
  emitterPickupSiteName: z.string().max(250).nullish(),
  emitterPickupSiteAddress: z.string().max(250).nullish(),
  emitterPickupSiteCity: z.string().max(250).nullish(),
  emitterPickupSitePostalCode: z.string().max(250).nullish(),
  emitterPickupSiteInfos: z.string().max(250).nullish(),
  emitterEmissionSignatureAuthor: z.string().max(250).nullish(),
  emitterEmissionSignatureDate: z.coerce.date().nullish(),
  ecoOrganismeName: z.string().max(250).nullish(),
  ecoOrganismeSiret: siretSchema(CompanyRole.EcoOrganisme).nullish(),
  wasteCode: ZodWasteCodeEnum,
  wasteFamilyCode: z.string().max(250).nullish(),
  wasteMaterialName: z.string().max(250).nullish(),
  wasteConsistence: z.nativeEnum(BsdaConsistence).nullish(),
  wasteConsistenceDescription: z.string().max(250).nullish(),
  wasteSealNumbers: z.array(z.string().max(250)).default([]),
  wasteIsSubjectToADR: z.boolean().nullish(),
  wasteAdr: z
    .string()
    .max(750)
    .nullish()
    // Empty values (or spaces) to null
    .transform(value =>
      isDefinedStrict(value?.replace(/\s/g, "")) ? value : null
    ),
  wasteNonRoadRegulationMention: z.string().max(750).nullish(),
  wastePop: z
    .boolean()
    .nullish()
    .transform(v => Boolean(v)),
  packagings: z
    .array(bsdaPackagingSchema)
    .nullish()
    .default([])
    .transform(val => (val == null ? [] : val)),
  weightIsEstimate: z
    .boolean()
    .nullish()
    .transform(v => Boolean(v)),
  weightValue: z.number().nullish(),
  brokerCompanyName: z.string().max(250).nullish(),
  brokerCompanySiret: siretSchema(CompanyRole.Broker).nullish(),
  brokerCompanyAddress: z.string().max(250).nullish(),
  brokerCompanyContact: z.string().max(250).nullish(),
  brokerCompanyPhone: z.string().max(250).nullish(),
  brokerCompanyMail: z.string().max(250).nullish(),
  brokerRecepisseNumber: z.string().max(250).nullish(),
  brokerRecepisseDepartment: z.string().max(250).nullish(),
  brokerRecepisseValidityLimit: z.coerce.date().nullish(),
  destinationCompanyName: z.string().max(250).nullish(),
  destinationCompanySiret: siretSchema(CompanyRole.Destination).nullish(),
  destinationCompanyAddress: z.string().max(250).nullish(),
  destinationCompanyContact: z.string().max(250).nullish(),
  destinationCompanyPhone: z.string().max(250).nullish(),
  destinationCompanyMail: z.string().max(250).nullish(),
  destinationCap: z.string().max(250).nullish(),
  destinationPlannedOperationCode: ZodOperationEnum,
  destinationCustomInfo: z.string().max(250).nullish(),
  destinationReceptionDate: z.coerce.date().nullish(),
  destinationReceptionWeight: z.number().nullish(),
  destinationReceptionWeightIsEstimate: z.boolean().nullish(),
  destinationReceptionRefusedWeight: z.number().min(0).nullish(),
  destinationReceptionAcceptationStatus: z
    .nativeEnum(WasteAcceptationStatus)
    .nullish(),
  destinationReceptionRefusalReason: z.string().max(250).nullish(),
  destinationOperationCode: ZodOperationEnum.nullish(),
  destinationOperationMode: z.nativeEnum(OperationMode).nullish(),
  destinationReceptionSignatureAuthor: z.string().max(250).nullish(),
  destinationReceptionSignatureDate: z.coerce.date().nullish(),
  destinationOperationDescription: z.string().max(250).nullish(),
  destinationOperationDate: z.coerce
    .date()
    .nullish()
    .refine(
      val => {
        if (!val) return true;
        // Compare only the date part (day) in UTC to avoid timezone issues
        // A date that is "today" in the user's timezone should be valid
        const operationDate = startOfDay(val);
        const today = startOfDayPlusOneDay(new Date());
        return operationDate <= today;
      },
      {
        message: "La date d'opération ne peut pas être dans le futur."
      }
    ),
  destinationOperationSignatureAuthor: z.string().max(250).nullish(),
  destinationOperationSignatureDate: z.coerce.date().nullish(),
  destinationOperationNextDestinationCompanySiret: siretSchema(
    CompanyRole.NextDestination
  ).nullish(),
  destinationOperationNextDestinationCompanyVatNumber: foreignVatNumberSchema(
    CompanyRole.NextDestination
  ).nullish(),
  destinationOperationNextDestinationCompanyName: z.string().max(250).nullish(),
  destinationOperationNextDestinationCompanyAddress: z
    .string()
    .max(250)
    .nullish(),
  destinationOperationNextDestinationCompanyContact: z
    .string()
    .max(250)
    .nullish(),
  destinationOperationNextDestinationCompanyPhone: z
    .string()
    .max(250)
    .nullish(),
  destinationOperationNextDestinationCompanyMail: z.string().max(250).nullish(),
  destinationOperationNextDestinationCap: z.string().max(250).nullish(),
  destinationOperationNextDestinationPlannedOperationCode: z
    .string()
    .max(250)
    .nullish(),
  workerIsDisabled: z
    .boolean()
    .default(false)
    .nullish()
    .transform(v => Boolean(v)),
  workerCompanyName: z.string().max(250).nullish(),
  workerCompanySiret: siretSchema(CompanyRole.Worker).nullish(),
  workerCompanyAddress: z.string().max(250).nullish(),
  workerCompanyContact: z.string().max(250).nullish(),
  workerCompanyPhone: z.string().max(250).nullish(),
  workerCompanyMail: z.string().nullish(),
  workerCertificationHasSubSectionFour: z
    .boolean()
    .nullish()
    .transform(v => Boolean(v)),
  workerCertificationHasSubSectionThree: z
    .boolean()
    .nullish()
    .transform(v => Boolean(v)),
  workerCertificationCertificationNumber: z.string().max(250).nullish(),
  workerCertificationValidityLimit: z.coerce.date().nullish(),
  workerCertificationOrganisation: ZodWorkerCertificationOrganismEnum,
  workerWorkHasEmitterPaperSignature: z
    .boolean()
    .nullish()
    .transform(v => Boolean(v)),
  workerWorkSignatureAuthor: z.string().max(250).nullish(),
  workerWorkSignatureDate: z.coerce.date().nullish(),
  transporters: z
    .array(rawBsdaTransporterSchema)
    .max(5, "Vous ne pouvez pas ajouter plus de 5 transporteurs")
    .optional(),
  grouping: z.array(z.string().max(50)).optional().nullish(),
  forwarding: z.string().max(50).nullish(),
  intermediaries: z
    .array(intermediarySchema)
    .nullish()
    .superRefine(intermediariesRefinement),
  intermediariesOrgIds: z.array(z.string().max(50)).optional(),
  transportersOrgIds: z.array(z.string().max(50)).optional()
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
  .superRefine(checkTransporters)
  .superRefine(validateMultiTransporterPlates)
  .superRefine(checkDestinationReceptionRefusedWeight);

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
    .superRefine(validateDestinationReceptionWeight(context))
    .superRefine(wasteAdrRefinement(context))
    .superRefine(validateReceptionOperationCode(context))
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

const refinedBsdaTransporter = rawBsdaTransporterSchema.superRefine(
  validateTransporterPlates
);

export const transformedBsdaTransporterSchema = refinedBsdaTransporter
  .transform(updateTransporterRecepisse)
  .transform(sirenifyBsdaTransporter);
