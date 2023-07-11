import { BsdaType, Prisma, WasteAcceptationStatus } from "@prisma/client";
import { RefinementCtx, z } from "zod";
import { BsdaSignatureType } from "../../generated/graphql/types";
import { PARTIAL_OPERATIONS } from "./constants";
import { ZodBsda } from "./schema";
import { isForeignVat } from "../../common/constants/companySearchHelpers";

type EditableBsdaFields = Required<
  Omit<
    Prisma.BsdaCreateInput,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "isDraft"
    | "isDeleted"
    | "status"
    | "emitterEmissionSignatureDate"
    | "emitterEmissionSignatureAuthor"
    | "transporterTransportSignatureAuthor"
    | "transporterTransportSignatureDate"
    | "workerWorkSignatureAuthor"
    | "workerWorkSignatureDate"
    | "destinationOperationSignatureAuthor"
    | "destinationOperationSignatureDate"
    | "groupedInId"
    | "forwardingId"
    | "groupedIn"
    | "forwardedIn"
    | "BsdaRevisionRequest"
    | "intermediariesOrgIds"
  >
>;

export const editionRules: {
  [Key in keyof EditableBsdaFields]: {
    sealedBy: BsdaSignatureType; // The type of signature that seals the field
    isRequired: boolean | ((val: ZodBsda) => boolean); // Whether or not the field is required when sealed. The rule can depend on other fields
    superRefineWhenSealed?: (val: ZodBsda[Key], ctx: RefinementCtx) => void; // For custom rules to apply when the field is sealed
    name?: string; // A custom field name for errors
  };
} = {
  type: { sealedBy: "EMISSION", isRequired: true },
  emitterIsPrivateIndividual: { sealedBy: "EMISSION", isRequired: true },
  emitterCompanyName: {
    sealedBy: "EMISSION",
    isRequired: true
  },
  emitterCompanySiret: {
    sealedBy: "EMISSION",
    isRequired: bsda => !bsda.emitterIsPrivateIndividual
  },
  emitterCompanyAddress: {
    sealedBy: "EMISSION",
    isRequired: true
  },
  emitterCompanyContact: {
    sealedBy: "EMISSION",
    isRequired: bsda => !bsda.emitterIsPrivateIndividual
  },
  emitterCompanyPhone: {
    sealedBy: "EMISSION",
    isRequired: bsda => !bsda.emitterIsPrivateIndividual
  },
  emitterCompanyMail: {
    sealedBy: "EMISSION",
    isRequired: bsda => !bsda.emitterIsPrivateIndividual
  },
  emitterCustomInfo: { sealedBy: "EMISSION", isRequired: false },
  emitterPickupSiteName: { sealedBy: "EMISSION", isRequired: false },
  emitterPickupSiteAddress: { sealedBy: "EMISSION", isRequired: false },
  emitterPickupSiteCity: { sealedBy: "EMISSION", isRequired: false },
  emitterPickupSitePostalCode: {
    sealedBy: "EMISSION",
    isRequired: false
  },
  emitterPickupSiteInfos: { sealedBy: "EMISSION", isRequired: false },
  ecoOrganismeName: {
    sealedBy: "TRANSPORT",
    isRequired: bsda => !!bsda.ecoOrganismeSiret
  },
  ecoOrganismeSiret: { sealedBy: "TRANSPORT", isRequired: false },
  destinationCompanyName: { sealedBy: "TRANSPORT", isRequired: true },
  destinationCompanySiret: {
    sealedBy: "TRANSPORT",
    isRequired: true
  },
  destinationCompanyAddress: { sealedBy: "TRANSPORT", isRequired: true },
  destinationCompanyContact: { sealedBy: "TRANSPORT", isRequired: true },
  destinationCompanyPhone: { sealedBy: "TRANSPORT", isRequired: true },
  destinationCompanyMail: { sealedBy: "TRANSPORT", isRequired: true },
  destinationCustomInfo: { sealedBy: "OPERATION", isRequired: false },
  destinationCap: {
    sealedBy: "TRANSPORT",
    isRequired: bsda =>
      [BsdaType.COLLECTION_2710, BsdaType.GATHERING, BsdaType.RESHIPMENT].every(
        type => bsda.type !== type
      ) &&
      PARTIAL_OPERATIONS.every(
        op => bsda.destinationPlannedOperationCode !== op
      )
  },
  destinationPlannedOperationCode: {
    sealedBy: "TRANSPORT",
    isRequired: true
  },
  destinationReceptionDate: { sealedBy: "OPERATION", isRequired: true },
  destinationReceptionWeight: { sealedBy: "OPERATION", isRequired: true },
  destinationReceptionAcceptationStatus: {
    sealedBy: "OPERATION",
    isRequired: true
  },
  destinationReceptionRefusalReason: {
    sealedBy: "OPERATION",
    isRequired: isRefusedOrPartiallyRefused
  },
  destinationOperationCode: {
    sealedBy: "OPERATION",
    isRequired: isNotRefused
  },
  destinationOperationDescription: {
    sealedBy: "OPERATION",
    isRequired: false
  },
  destinationOperationDate: {
    sealedBy: "OPERATION",
    isRequired: isNotRefused
  },
  destinationOperationNextDestinationCompanyName: {
    sealedBy: "OPERATION",
    isRequired: false
  },
  destinationOperationNextDestinationCompanySiret: {
    sealedBy: "OPERATION",
    isRequired: false
  },
  destinationOperationNextDestinationCompanyVatNumber: {
    sealedBy: "OPERATION",
    isRequired: false
  },
  destinationOperationNextDestinationCompanyAddress: {
    sealedBy: "OPERATION",
    isRequired: false
  },
  destinationOperationNextDestinationCompanyContact: {
    sealedBy: "OPERATION",
    isRequired: false
  },
  destinationOperationNextDestinationCompanyPhone: {
    sealedBy: "OPERATION",
    isRequired: false
  },
  destinationOperationNextDestinationCompanyMail: {
    sealedBy: "OPERATION",
    isRequired: false
  },
  destinationOperationNextDestinationCap: {
    sealedBy: "OPERATION",
    isRequired: bsda =>
      Boolean(bsda.destinationOperationNextDestinationCompanySiret)
  },
  destinationOperationNextDestinationPlannedOperationCode: {
    sealedBy: "OPERATION",
    isRequired: bsda =>
      Boolean(bsda.destinationOperationNextDestinationCompanySiret)
  },
  transporterCompanyName: {
    sealedBy: "TRANSPORT",
    isRequired: hasTransporter
  },
  transporterCompanySiret: {
    sealedBy: "TRANSPORT",
    isRequired: bsda =>
      !bsda.transporterCompanyVatNumber && hasTransporter(bsda)
  },
  transporterCompanyAddress: {
    sealedBy: "TRANSPORT",
    isRequired: hasTransporter
  },
  transporterCompanyContact: {
    sealedBy: "TRANSPORT",
    isRequired: hasTransporter
  },
  transporterCompanyPhone: {
    sealedBy: "TRANSPORT",
    isRequired: hasTransporter
  },
  transporterCompanyMail: {
    sealedBy: "TRANSPORT",
    isRequired: hasTransporter
  },
  transporterCompanyVatNumber: {
    sealedBy: "TRANSPORT",
    isRequired: bsda => !bsda.transporterCompanySiret && hasTransporter(bsda)
  },
  transporterCustomInfo: { sealedBy: "TRANSPORT", isRequired: false },
  transporterRecepisseIsExempted: {
    sealedBy: "TRANSPORT",
    isRequired: hasTransporter
  },
  transporterRecepisseNumber: {
    sealedBy: "TRANSPORT",
    isRequired: bsda =>
      hasTransporter(bsda) &&
      !bsda.transporterRecepisseIsExempted &&
      !isForeignVat(bsda.transporterCompanyVatNumber),
    name: "le numéro de récépissé transporteur"
  },
  transporterRecepisseDepartment: {
    sealedBy: "TRANSPORT",
    isRequired: bsda =>
      hasTransporter(bsda) &&
      !bsda.transporterRecepisseIsExempted &&
      !isForeignVat(bsda.transporterCompanyVatNumber),
    name: "le département de récépissé transporteur"
  },
  transporterRecepisseValidityLimit: {
    sealedBy: "TRANSPORT",
    isRequired: bsda =>
      hasTransporter(bsda) &&
      !bsda.transporterRecepisseIsExempted &&
      !isForeignVat(bsda.transporterCompanyVatNumber),
    name: "la date de validité du récépissé transporteur"
  },
  transporterTransportMode: {
    sealedBy: "TRANSPORT",
    isRequired: hasTransporter,
    name: "le mode de transport"
  },
  transporterTransportPlates: {
    sealedBy: "TRANSPORT",
    isRequired: bsda =>
      hasTransporter(bsda) && bsda.transporterTransportMode === "ROAD"
  },
  transporterTransportTakenOverAt: {
    sealedBy: "TRANSPORT",
    isRequired: false
  },
  workerIsDisabled: {
    sealedBy: "EMISSION",
    isRequired: hasWorker
  },
  workerCompanyName: {
    sealedBy: "EMISSION",
    isRequired: hasWorker
  },
  workerCompanySiret: {
    sealedBy: "EMISSION",
    isRequired: hasWorker
  },
  workerCompanyAddress: {
    sealedBy: "EMISSION",
    isRequired: hasWorker
  },
  workerCompanyContact: {
    sealedBy: "EMISSION",
    isRequired: hasWorker
  },
  workerCompanyPhone: {
    sealedBy: "EMISSION",
    isRequired: hasWorker
  },
  workerCompanyMail: {
    sealedBy: "EMISSION",
    isRequired: hasWorker
  },
  workerWorkHasEmitterPaperSignature: {
    sealedBy: "WORK",
    isRequired: false
  },
  workerCertificationHasSubSectionFour: {
    sealedBy: "WORK",
    isRequired: false
  },
  workerCertificationHasSubSectionThree: {
    sealedBy: "WORK",
    isRequired: false
  },
  workerCertificationCertificationNumber: {
    sealedBy: "WORK",
    isRequired: bsda => Boolean(bsda.workerCertificationHasSubSectionThree)
  },
  workerCertificationValidityLimit: {
    sealedBy: "WORK",
    isRequired: bsda => Boolean(bsda.workerCertificationHasSubSectionThree)
  },
  workerCertificationOrganisation: {
    sealedBy: "WORK",
    isRequired: bsda => Boolean(bsda.workerCertificationHasSubSectionThree)
  },
  brokerCompanyName: { sealedBy: "EMISSION", isRequired: false },
  brokerCompanySiret: { sealedBy: "EMISSION", isRequired: false },
  brokerCompanyAddress: { sealedBy: "EMISSION", isRequired: false },
  brokerCompanyContact: { sealedBy: "EMISSION", isRequired: false },
  brokerCompanyPhone: { sealedBy: "EMISSION", isRequired: false },
  brokerCompanyMail: { sealedBy: "EMISSION", isRequired: false },
  brokerRecepisseNumber: { sealedBy: "EMISSION", isRequired: false },
  brokerRecepisseDepartment: { sealedBy: "EMISSION", isRequired: false },
  brokerRecepisseValidityLimit: {
    sealedBy: "EMISSION",
    isRequired: false
  },
  wasteCode: { sealedBy: "EMISSION", isRequired: true, name: "le code déchet" },
  wasteAdr: { sealedBy: "WORK", isRequired: true },
  wasteFamilyCode: {
    sealedBy: "WORK",
    isRequired: true,
    name: "le code famille"
  },
  wasteMaterialName: { sealedBy: "WORK", isRequired: true },
  wasteConsistence: {
    sealedBy: "WORK",
    isRequired: true,
    name: "la consistance"
  },
  wasteSealNumbers: { sealedBy: "WORK", isRequired: true },
  wastePop: { sealedBy: "WORK", isRequired: true },
  packagings: {
    sealedBy: "WORK",
    isRequired: true,
    name: "le conditionnement",
    superRefineWhenSealed(val, ctx) {
      if (val.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          type: "array",
          minimum: 1,
          inclusive: true,
          message: "Le conditionnement est obligatoire"
        });
      }
    }
  },
  weightIsEstimate: { sealedBy: "WORK", isRequired: true },
  weightValue: { sealedBy: "WORK", isRequired: true },
  grouping: { sealedBy: "EMISSION", isRequired: false },
  forwarding: { sealedBy: "EMISSION", isRequired: false },
  intermediaries: { sealedBy: "TRANSPORT", isRequired: false }
};

function hasWorker(bsda: ZodBsda) {
  return (
    [BsdaType.RESHIPMENT, BsdaType.GATHERING, BsdaType.COLLECTION_2710].every(
      type => type !== bsda.type
    ) && !bsda.workerIsDisabled
  );
}

function hasTransporter(bsda: ZodBsda) {
  return bsda.type !== BsdaType.COLLECTION_2710;
}

function isRefusedOrPartiallyRefused(bsda: ZodBsda) {
  return (
    !!bsda.destinationReceptionAcceptationStatus &&
    [
      WasteAcceptationStatus.REFUSED,
      WasteAcceptationStatus.PARTIALLY_REFUSED
    ].includes(bsda.destinationReceptionAcceptationStatus)
  );
}

function isNotRefused(bsda: ZodBsda) {
  return (
    bsda.destinationReceptionAcceptationStatus !==
    WasteAcceptationStatus.REFUSED
  );
}
