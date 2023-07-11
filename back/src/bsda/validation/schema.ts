import {
  BsdaConsistence,
  BsdaType,
  TransportMode,
  WasteAcceptationStatus
} from "@prisma/client";
import { z } from "zod";
import { BSDA_WASTE_CODES } from "../../common/constants";
import {
  intermediariesRefinement,
  intermediarySchema
} from "../../common/validation/intermediaries";
import {
  isRegisteredSiretRefinement,
  isRegisteredVatNumberRefinement,
  siretSchema,
  foreignVatNumberSchema
} from "../../common/validation/siret";
import getReadableId, { ReadableIdPrefix } from "../../forms/readableId";
import { OPERATIONS, WORKER_CERTIFICATION_ORGANISM } from "./constants";
import { noEmptyString } from "../../common/converter";

const bsdaPackagingSchema = z
  .object({
    type: z.enum([
      "BIG_BAG",
      "CONTENEUR_BAG",
      "DEPOT_BAG",
      "OTHER",
      "PALETTE_FILME",
      "SAC_RENFORCE"
    ]),
    other: z.string().nullish(),
    quantity: z.number()
  })
  .refine(val => val.type !== "OTHER" || !!val.other, {
    message:
      "Vous devez saisir la description du conditionnement quand le type de conditionnement est 'Autre'"
  });

export const rawBsdaSchema = z
  .object({
    id: z.string().default(() => getReadableId(ReadableIdPrefix.BSDA)),
    isDraft: z.boolean().default(false),
    isDeleted: z.boolean().default(false),
    type: z.nativeEnum(BsdaType).default(BsdaType.OTHER_COLLECTIONS),
    emitterIsPrivateIndividual: z.coerce
      .boolean()
      .nullish()
      .transform(v => Boolean(v)),
    emitterCompanyName: z.string().nullish(),
    emitterCompanySiret: siretSchema.nullish(),
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
    ecoOrganismeSiret: siretSchema.nullish(),
    wasteCode: z.enum(BSDA_WASTE_CODES).nullish(),
    wasteFamilyCode: z.string().nullish(),
    wasteMaterialName: z.string().nullish(),
    wasteConsistence: z.nativeEnum(BsdaConsistence).nullish(),
    wasteSealNumbers: z.array(z.string()).default([]),
    wasteAdr: z.string().nullish(),
    wastePop: z.coerce.boolean().transform(v => Boolean(v)),
    packagings: z
      .array(bsdaPackagingSchema)
      .default([])
      .transform(val => (val == null ? [] : val)),
    weightIsEstimate: z.coerce
      .boolean()
      .nullish()
      .transform(v => Boolean(v)),
    weightValue: z.number().nullish(),
    brokerCompanyName: z.string().nullish(),
    brokerCompanySiret: siretSchema.nullish(),
    brokerCompanyAddress: z.string().nullish(),
    brokerCompanyContact: z.string().nullish(),
    brokerCompanyPhone: z.string().nullish(),
    brokerCompanyMail: z.string().nullish(),
    brokerRecepisseNumber: z.string().nullish(),
    brokerRecepisseDepartment: z.string().nullish(),
    brokerRecepisseValidityLimit: z.coerce.date().nullish(),
    destinationCompanyName: z.string().nullish(),
    destinationCompanySiret: siretSchema
      .nullish()
      .superRefine(isRegisteredSiretRefinement("DESTINATION")),
    destinationCompanyAddress: z.string().nullish(),
    destinationCompanyContact: z.string().nullish(),
    destinationCompanyPhone: z.string().nullish(),
    destinationCompanyMail: z.string().nullish(),
    destinationCap: z.string().nullish(),
    destinationPlannedOperationCode: z.enum(OPERATIONS).nullish(),
    destinationCustomInfo: z.string().nullish(),
    destinationReceptionDate: z.coerce.date().nullish(),
    destinationReceptionWeight: z.number().nullish(),
    destinationReceptionAcceptationStatus: z
      .nativeEnum(WasteAcceptationStatus)
      .nullish(),
    destinationReceptionRefusalReason: z.string().nullish(),
    destinationOperationCode: z.enum(OPERATIONS).nullish(),
    destinationOperationDescription: z.string().nullish(),
    destinationOperationDate: z.coerce
      .date()
      .nullish()
      .refine(val => !val || val < new Date(), {
        message: "La date d'opération ne peut pas être dans le futur."
      }),
    destinationOperationSignatureAuthor: z.string().nullish(),
    destinationOperationSignatureDate: z.coerce.date().nullish(),
    destinationOperationNextDestinationCompanySiret: siretSchema
      .nullish()
      .superRefine(isRegisteredSiretRefinement("DESTINATION")),
    destinationOperationNextDestinationCompanyVatNumber:
      foreignVatNumberSchema.nullish(),
    destinationOperationNextDestinationCompanyName: z.string().nullish(),
    destinationOperationNextDestinationCompanyAddress: z.string().nullish(),
    destinationOperationNextDestinationCompanyContact: z.string().nullish(),
    destinationOperationNextDestinationCompanyPhone: z.string().nullish(),
    destinationOperationNextDestinationCompanyMail: z.string().nullish(),
    destinationOperationNextDestinationCap: z.string().nullish(),
    destinationOperationNextDestinationPlannedOperationCode: z
      .string()
      .nullish(),
    transporterCompanyName: z.string().nullish(),
    transporterCompanySiret: siretSchema.nullish(),
    // Further verifications done hereunder in superRefine
    transporterCompanyAddress: z.string().nullish(),
    transporterCompanyContact: z.string().nullish(),
    transporterCompanyPhone: z.string().nullish(),
    transporterCompanyMail: z.string().nullish(),
    transporterCompanyVatNumber: foreignVatNumberSchema
      .nullish()
      .superRefine(isRegisteredVatNumberRefinement),
    transporterCustomInfo: z.string().nullish(),
    transporterRecepisseIsExempted: z.coerce
      .boolean()
      .nullish()
      .transform(v => Boolean(v)),
    transporterRecepisseNumber: z.string().nullish(),
    transporterRecepisseDepartment: z.string().nullish(),
    transporterRecepisseValidityLimit: z.coerce.date().nullish(),
    transporterTransportMode: z.nativeEnum(TransportMode).nullish(),
    transporterTransportPlates: z
      .array(z.string())
      .max(2, "Un maximum de 2 plaques d'immatriculation est accepté")
      .default([]),
    transporterTransportTakenOverAt: z.coerce.date().nullish(),
    transporterTransportSignatureAuthor: z.string().nullish(),
    transporterTransportSignatureDate: z.coerce.date().nullish(),
    workerIsDisabled: z.coerce
      .boolean()
      .default(false)
      .nullish()
      .transform(v => Boolean(v)),
    workerCompanyName: z.string().nullish(),
    workerCompanySiret: siretSchema.nullish(),
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
    workerCertificationOrganisation: z
      .enum(WORKER_CERTIFICATION_ORGANISM)
      .nullish(),
    workerWorkHasEmitterPaperSignature: z.coerce
      .boolean()
      .nullish()
      .transform(v => Boolean(v)),
    workerWorkSignatureAuthor: z.string().nullish(),
    workerWorkSignatureDate: z.coerce.date().nullish(),
    grouping: z.array(z.string()).optional(),
    forwarding: z.string().nullish(),
    intermediaries: z
      .array(intermediarySchema)
      .nullish()
      .superRefine(intermediariesRefinement),
    intermediariesOrgIds: z.array(z.string()).optional()
  })
  .superRefine(async (val, ctx) => {
    if (
      val.destinationReceptionDate &&
      val.destinationOperationDate &&
      val.destinationOperationDate < val.destinationReceptionDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `La date d'opération doit être postérieure à la date de réception`
      });
    }

    if (val.emitterIsPrivateIndividual && val.emitterCompanySiret) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `L'émetteur est un particulier, impossible de saisir un SIRET émetteur`
      });
    }

    if (
      val.workerIsDisabled &&
      (val.workerCompanyName || val.workerCompanySiret)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Il n'y a pas d'entreprise de travaux, impossible de saisir le SIRET ou le nom de l'entreprise de travaux.`
      });
    }

    if (
      !val.workerCertificationHasSubSectionThree &&
      (val.workerCertificationCertificationNumber ||
        val.workerCertificationValidityLimit ||
        val.workerCertificationOrganisation)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Il n'y a pas de certification sous-section 3 amiante déclarée. Impossible de remplir les champs de la sous-section 3.`
      });
    }

    if (
      val.type === BsdaType.COLLECTION_2710 &&
      (noEmptyString(val.transporterCompanyName) != null ||
        noEmptyString(val.transporterCompanySiret) != null)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Impossible de saisir un transporteur pour un bordereau de collecte en déchetterie.`
      });
    }

    if (
      val.type === BsdaType.COLLECTION_2710 &&
      (noEmptyString(val.workerCompanyName) != null ||
        noEmptyString(val.workerCompanySiret) != null)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Impossible de saisir une entreprise de travaux pour un bordereau de collecte en déchetterie.`
      });
    }

    const isForwarding = Boolean(val.forwarding);
    const isGrouping = Boolean(val.grouping?.length);

    if ([isForwarding, isGrouping].filter(b => b).length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Les opérations d'entreposage provisoire et groupement ne sont pas compatibles entre elles"
      });
    }

    // Additionnal checks on the transporterCompanySiret
    await isRegisteredSiretRefinement(
      "TRANSPORTER",
      val.transporterRecepisseIsExempted
    )(val.transporterCompanySiret ?? "", ctx);
  })
  .transform(val => {
    val.intermediariesOrgIds = val.intermediaries
      ? val.intermediaries
          .flatMap(intermediary => [intermediary.siret, intermediary.vatNumber])
          .filter(Boolean)
      : undefined;

    return val;
  });

export type ZodBsda = z.infer<typeof rawBsdaSchema>;
