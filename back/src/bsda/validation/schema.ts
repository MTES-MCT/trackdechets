import {
  Bsda,
  BsdaStatus,
  BsdaType,
  BsdaConsistence,
  WasteAcceptationStatus,
  TransportMode
} from "@prisma/client";
import { z } from "zod";
import { BSDA_WASTE_CODES } from "../../common/constants";
import getReadableId, { ReadableIdPrefix } from "../../forms/readableId";
import { OPERATIONS } from "../validation";

export const rawBsdaSchema = z
  .object({
    id: z.string().default(() => getReadableId(ReadableIdPrefix.BSDA)),
    createdAt: z.date(),
    updatedAt: z.date(),
    isDraft: z.boolean().default(false),
    isDeleted: z.boolean().default(false),
    status: z.nativeEnum(BsdaStatus).default(BsdaStatus.INITIAL),
    type: z.nativeEnum(BsdaType),
    emitterIsPrivateIndividual: z.boolean().nullish(),
    emitterCompanyName: z.string().nullish(),
    emitterCompanySiret: z.string().length(14).nullish(),
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
    ecoOrganismeSiret: z.string().nullish(),
    wasteCode: z.enum(BSDA_WASTE_CODES).nullish(),
    wasteFamilyCode: z.string().nullish(),
    wasteMaterialName: z.string().nullish(),
    wasteConsistence: z.nativeEnum(BsdaConsistence).nullish(),
    wasteSealNumbers: z.array(z.string()).default([]),
    wasteAdr: z.string().nullish(),
    wastePop: z.coerce.boolean(),
    packagings: z
      .array(
        z.object({
          type: z.enum([
            "BIG_BAG",
            "CONTENEUR_BAG",
            "DEPOT_BAG",
            "OTHER",
            "PALETTE_FILME",
            "SAC_RENFORCE"
          ]),
          other: z.string(),
          quantity: z.number()
        })
      )
      .default([]),
    weightIsEstimate: z.coerce.boolean().nullish(),
    weightValue: z.number().nullish(),
    brokerCompanyName: z.string().nullish(),
    brokerCompanySiret: z.string().nullish(),
    brokerCompanyAddress: z.string().nullish(),
    brokerCompanyContact: z.string().nullish(),
    brokerCompanyPhone: z.string().nullish(),
    brokerCompanyMail: z.string().nullish(),
    brokerRecepisseNumber: z.string().nullish(),
    brokerRecepisseDepartment: z.string().nullish(),
    brokerRecepisseValidityLimit: z.coerce.date().nullish(),
    destinationCompanyName: z.string().nullish(),
    destinationCompanySiret: z.string().nullish(),
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
    destinationOperationDate: z.coerce.date().max(new Date()).nullish(),
    destinationOperationSignatureAuthor: z.string().nullish(),
    destinationOperationSignatureDate: z.coerce.date().nullish(),
    destinationOperationNextDestinationCompanySiret: z.string().nullish(),
    destinationOperationNextDestinationCompanyVatNumber: z.string().nullish(),
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
    transporterCompanySiret: z.string().nullish(),
    transporterCompanyAddress: z.string().nullish(),
    transporterCompanyContact: z.string().nullish(),
    transporterCompanyPhone: z.string().nullish(),
    transporterCompanyMail: z.string().nullish(),
    transporterCompanyVatNumber: z.string().nullish(),
    transporterCustomInfo: z.string().nullish(),
    transporterRecepisseIsExempted: z.coerce.boolean().nullish(),
    transporterRecepisseNumber: z.string().nullish(),
    transporterRecepisseDepartment: z.string().nullish(),
    transporterRecepisseValidityLimit: z.coerce.date().nullish(),
    transporterTransportMode: z.nativeEnum(TransportMode).nullish(),
    transporterTransportPlates: z.array(z.string()),
    transporterTransportTakenOverAt: z.coerce.date().nullish(),
    transporterTransportSignatureAuthor: z.string().nullish(),
    transporterTransportSignatureDate: z.coerce.date().nullish(),
    workerIsDisabled: z.coerce.boolean().nullish(),
    workerCompanyName: z.string().nullish(),
    workerCompanySiret: z.string().nullish(),
    workerCompanyAddress: z.string().nullish(),
    workerCompanyContact: z.string().nullish(),
    workerCompanyPhone: z.string().nullish(),
    workerCompanyMail: z.string().nullish(),
    workerCertificationHasSubSectionFour: z.coerce.boolean().nullish(),
    workerCertificationHasSubSectionThree: z.coerce.boolean().nullish(),
    workerCertificationCertificationNumber: z.string().nullish(),
    workerCertificationValidityLimit: z.coerce.date().nullish(),
    workerCertificationOrganisation: z
      .enum(["AFNOR Certification", "GLOBAL CERTIFICATION", "QUALIBAT"])
      .nullish(),
    workerWorkHasEmitterPaperSignature: z.coerce.boolean().nullish(),
    workerWorkSignatureAuthor: z.string().nullish(),
    workerWorkSignatureDate: z.coerce.date().nullish(),
    grouping: z.array(z.string()).optional(),
    forwarding: z.string().optional(),
    intermediaries: z
      .array(
        z.object({
          siret: z.string().nullish(),
          vatNumber: z.string().nullish(),
          contact: z.string().nullish(),
          address: z.string().nullish(),
          name: z.string().nullish(),
          phone: z.string().nullish(),
          mail: z.string().nullish(),
          country: z.string().nullish(),
          omiNumber: z.string().nullish(),
          orgId: z.string().nullish()
        })
      )
      .nullish(),
    intermediariesOrgIds: z.array(z.string()).nullish()
  })
  .transform(val => {
    val.intermediariesOrgIds = val.intermediaries
      ?.flatMap(intermediary => [intermediary.siret, intermediary.vatNumber])
      .filter(Boolean) as string[];

    // Here would be a

    return val;
  });

export type ZodBsda = z.infer<typeof rawBsdaSchema>;
