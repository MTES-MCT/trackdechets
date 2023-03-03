import { Bsda, BsdaType, Prisma, WasteAcceptationStatus } from "@prisma/client";
import { RefinementCtx, z } from "zod";
import { BsdaSignatureType } from "../../generated/graphql/types";
import { PARTIAL_OPERATIONS } from "../validation";
import { ZodBsda } from "./schema";

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
    isRequired: boolean | ((val: ZodBsda) => boolean); // Field must be filled. The rule can depend on other fields
    isForbidden?: (val: ZodBsda, isRequired: boolean) => boolean; // Field must not set. The rule can depend on other fields or the result of `isRequired` as fields are often either required or forbiden
    superRefine?: (val: ZodBsda, ctx: RefinementCtx) => void; // For other custom rules, we use a refine
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
    isRequired: bsda => !bsda.emitterIsPrivateIndividual,
    isForbidden: isNotRequired
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
  ecoOrganismeName: { sealedBy: "TRANSPORT", isRequired: true },
  ecoOrganismeSiret: { sealedBy: "TRANSPORT", isRequired: true },
  destinationCompanyName: { sealedBy: "EMISSION", isRequired: true },
  destinationCompanySiret: { sealedBy: "EMISSION", isRequired: true },
  destinationCompanyAddress: { sealedBy: "EMISSION", isRequired: true },
  destinationCompanyContact: { sealedBy: "EMISSION", isRequired: true },
  destinationCompanyPhone: { sealedBy: "EMISSION", isRequired: true },
  destinationCompanyMail: { sealedBy: "EMISSION", isRequired: true },
  destinationCustomInfo: { sealedBy: "OPERATION", isRequired: true },
  destinationCap: {
    sealedBy: "EMISSION",
    isRequired: bsda =>
      [BsdaType.COLLECTION_2710, BsdaType.GATHERING, BsdaType.RESHIPMENT].every(
        type => bsda.type !== type
      ) &&
      PARTIAL_OPERATIONS.every(
        op => bsda.destinationPlannedOperationCode !== op
      )
  },
  destinationPlannedOperationCode: {
    sealedBy: "EMISSION",
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
    isRequired: isNotRefusedOrPartiallyRefused
  },
  destinationOperationCode: {
    sealedBy: "OPERATION",
    isRequired: isNotRefused
  },
  destinationOperationDescription: {
    sealedBy: "OPERATION",
    isRequired: true
  },
  destinationOperationDate: {
    sealedBy: "OPERATION",
    isRequired: isNotRefused,
    superRefine: (val, ctx) => {
      if (
        val.destinationReceptionDate &&
        val.destinationOperationDate &&
        val.destinationOperationDate <= val.destinationReceptionDate
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `La date d'opération doit être postérieure à la date de réception`
        });
      }
    }
  },
  destinationOperationNextDestinationCompanyName: {
    sealedBy: "OPERATION",
    isRequired: true
  },
  destinationOperationNextDestinationCompanySiret: {
    sealedBy: "OPERATION",
    isRequired: true
  },
  destinationOperationNextDestinationCompanyVatNumber: {
    sealedBy: "OPERATION",
    isRequired: true
  },
  destinationOperationNextDestinationCompanyAddress: {
    sealedBy: "OPERATION",
    isRequired: true
  },
  destinationOperationNextDestinationCompanyContact: {
    sealedBy: "OPERATION",
    isRequired: true
  },
  destinationOperationNextDestinationCompanyPhone: {
    sealedBy: "OPERATION",
    isRequired: true
  },
  destinationOperationNextDestinationCompanyMail: {
    sealedBy: "OPERATION",
    isRequired: true
  },
  destinationOperationNextDestinationCap: {
    sealedBy: "OPERATION",
    isRequired: bsda =>
      Boolean(bsda.destinationOperationNextDestinationCompanySiret)
  },
  destinationOperationNextDestinationPlannedOperationCode: {
    sealedBy: "OPERATION",
    isRequired: true
  },
  transporterCompanyName: { sealedBy: "TRANSPORT", isRequired: true },
  transporterCompanySiret: { sealedBy: "TRANSPORT", isRequired: true },
  transporterCompanyAddress: { sealedBy: "TRANSPORT", isRequired: true },
  transporterCompanyContact: { sealedBy: "TRANSPORT", isRequired: true },
  transporterCompanyPhone: { sealedBy: "TRANSPORT", isRequired: true },
  transporterCompanyMail: { sealedBy: "TRANSPORT", isRequired: true },
  transporterCompanyVatNumber: {
    sealedBy: "TRANSPORT",
    isRequired: true
  },
  transporterCustomInfo: { sealedBy: "TRANSPORT", isRequired: true },
  transporterRecepisseIsExempted: {
    sealedBy: "TRANSPORT",
    isRequired: true
  },
  transporterRecepisseNumber: { sealedBy: "TRANSPORT", isRequired: true },
  transporterRecepisseDepartment: {
    sealedBy: "TRANSPORT",
    isRequired: true
  },
  transporterRecepisseValidityLimit: {
    sealedBy: "TRANSPORT",
    isRequired: true
  },
  transporterTransportMode: { sealedBy: "TRANSPORT", isRequired: true },
  transporterTransportPlates: { sealedBy: "TRANSPORT", isRequired: true },
  transporterTransportTakenOverAt: {
    sealedBy: "TRANSPORT",
    isRequired: true
  },
  workerIsDisabled: {
    sealedBy: "EMISSION",
    isRequired: hasNoWorker
  },
  workerCompanyName: {
    sealedBy: "EMISSION",
    isRequired: hasNoWorker,
    isForbidden: isNotRequired
  },
  workerCompanySiret: {
    sealedBy: "EMISSION",
    isRequired: hasNoWorker,
    isForbidden: isNotRequired
  },
  workerCompanyAddress: {
    sealedBy: "EMISSION",
    isRequired: hasNoWorker
  },
  workerCompanyContact: {
    sealedBy: "EMISSION",
    isRequired: hasNoWorker
  },
  workerCompanyPhone: {
    sealedBy: "EMISSION",
    isRequired: hasNoWorker
  },
  workerCompanyMail: {
    sealedBy: "EMISSION",
    isRequired: hasNoWorker
  },
  workerWorkHasEmitterPaperSignature: {
    sealedBy: "WORK",
    isRequired: true
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
    isRequired: bsda => Boolean(bsda.workerCertificationHasSubSectionThree),
    isForbidden: isNotRequired
  },
  workerCertificationValidityLimit: {
    sealedBy: "WORK",
    isRequired: bsda => Boolean(bsda.workerCertificationHasSubSectionThree),
    isForbidden: isNotRequired
  },
  workerCertificationOrganisation: {
    sealedBy: "WORK",
    isRequired: bsda => Boolean(bsda.workerCertificationHasSubSectionThree),
    isForbidden: isNotRequired
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
  wasteCode: { sealedBy: "EMISSION", isRequired: true },
  wasteAdr: { sealedBy: "WORK", isRequired: true },
  wasteFamilyCode: { sealedBy: "WORK", isRequired: true },
  wasteMaterialName: { sealedBy: "WORK", isRequired: true },
  wasteConsistence: { sealedBy: "WORK", isRequired: true },
  wasteSealNumbers: { sealedBy: "WORK", isRequired: true },
  wastePop: { sealedBy: "WORK", isRequired: true },
  packagings: { sealedBy: "WORK", isRequired: true },
  weightIsEstimate: { sealedBy: "WORK", isRequired: true },
  weightValue: { sealedBy: "WORK", isRequired: true },
  grouping: { sealedBy: "EMISSION", isRequired: false },
  forwarding: { sealedBy: "EMISSION", isRequired: false },
  intermediaries: { sealedBy: "TRANSPORT", isRequired: false }
};

function hasNoWorker(bsda: ZodBsda) {
  return (
    [BsdaType.RESHIPMENT, BsdaType.GATHERING, BsdaType.COLLECTION_2710].every(
      type => type !== bsda.type
    ) && !bsda.workerIsDisabled
  );
}

function isNotRefusedOrPartiallyRefused(bsda: ZodBsda) {
  return (
    bsda.destinationReceptionAcceptationStatus !==
      WasteAcceptationStatus.PARTIALLY_REFUSED && isNotRefused(bsda)
  );
}

function isNotRefused(bsda: ZodBsda) {
  return (
    bsda.destinationReceptionAcceptationStatus !==
    WasteAcceptationStatus.REFUSED
  );
}

function isNotRequired(_, isRequired: boolean) {
  return !isRequired;
}
