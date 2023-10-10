import { BsdaType, Prisma, WasteAcceptationStatus } from "@prisma/client";
import { RefinementCtx, z } from "zod";
import { BsdaSignatureType } from "../../generated/graphql/types";
import { PARTIAL_OPERATIONS } from "./constants";
import { ZodBsda } from "./schema";
import { isForeignVat } from "../../common/constants/companySearchHelpers";

export type EditableBsdaFields = Required<
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

export type Check = boolean | ((val: ZodBsda) => boolean);
export type FieldCheck = {
  from: BsdaSignatureType;
  when?: Check; // Default to 'true'
};

export type EditionRules = {
  [Key in keyof EditableBsdaFields]: {
    // At what signature the field is sealed, and under which circumstances
    sealed: FieldCheck;
    // At what signature the field is required, and under which circumstances. If absent, field is never required
    required?: FieldCheck;
    superRefineWhenSealed?: (val: ZodBsda[Key], ctx: RefinementCtx) => void; // For custom rules to apply when the field is sealed
    name?: string; // A custom field name for errors
    suffix?: string; // A custom message at the end of the error
  };
};

export const editionRules: EditionRules = {
  type: {
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" }
  },
  emitterIsPrivateIndividual: {
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" }
  },
  emitterCompanyName: {
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" }
  },
  emitterCompanySiret: {
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION",
      when: bsda => !bsda.emitterIsPrivateIndividual
    }
  },
  emitterCompanyAddress: {
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" }
  },
  emitterCompanyContact: {
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION",
      when: bsda => !bsda.emitterIsPrivateIndividual
    }
  },
  emitterCompanyPhone: {
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION",
      when: bsda => !bsda.emitterIsPrivateIndividual
    }
  },
  emitterCompanyMail: {
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION",
      when: bsda => !bsda.emitterIsPrivateIndividual
    }
  },
  emitterCustomInfo: { sealed: { from: "EMISSION" } },
  emitterPickupSiteName: { sealed: { from: "EMISSION" } },
  emitterPickupSiteAddress: { sealed: { from: "EMISSION" } },
  emitterPickupSiteCity: { sealed: { from: "EMISSION" } },
  emitterPickupSitePostalCode: {
    sealed: { from: "EMISSION" }
  },
  emitterPickupSiteInfos: { sealed: { from: "EMISSION" } },
  ecoOrganismeName: {
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: bsda => !!bsda.ecoOrganismeSiret
    }
  },
  ecoOrganismeSiret: { sealed: { from: "TRANSPORT" } },
  destinationCompanyName: {
    sealed: { from: "TRANSPORT" },
    required: { from: "TRANSPORT" }
  },
  destinationCompanySiret: {
    sealed: { from: "TRANSPORT" },
    required: { from: "TRANSPORT" }
  },
  destinationCompanyAddress: {
    sealed: { from: "TRANSPORT" },
    required: { from: "TRANSPORT" }
  },
  destinationCompanyContact: {
    sealed: { from: "TRANSPORT" },
    required: { from: "TRANSPORT" }
  },
  destinationCompanyPhone: {
    sealed: { from: "TRANSPORT" },
    required: { from: "TRANSPORT" }
  },
  destinationCompanyMail: {
    sealed: { from: "TRANSPORT" },
    required: { from: "TRANSPORT" }
  },
  destinationCustomInfo: { sealed: { from: "OPERATION" } },
  destinationCap: {
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: bsda =>
        [
          BsdaType.COLLECTION_2710,
          BsdaType.GATHERING,
          BsdaType.RESHIPMENT
        ].every(type => bsda.type !== type) &&
        PARTIAL_OPERATIONS.every(
          op => bsda.destinationPlannedOperationCode !== op
        )
    }
  },
  destinationPlannedOperationCode: {
    sealed: { from: "TRANSPORT" },
    required: { from: "TRANSPORT" }
  },
  destinationReceptionDate: {
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION" }
  },
  destinationReceptionWeight: {
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION" }
  },
  destinationReceptionAcceptationStatus: {
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION" }
  },
  destinationReceptionRefusalReason: {
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION", when: isRefusedOrPartiallyRefused }
  },
  destinationOperationCode: {
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION", when: isNotRefused }
  },
  destinationOperationMode: {
    sealed: { from: "OPERATION" }
  },
  destinationOperationDescription: {
    sealed: { from: "OPERATION" }
  },
  destinationOperationDate: {
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION", when: isNotRefused }
  },
  destinationOperationNextDestinationCompanyName: {
    sealed: { from: "OPERATION" }
  },
  destinationOperationNextDestinationCompanySiret: {
    sealed: { from: "OPERATION" }
  },
  destinationOperationNextDestinationCompanyVatNumber: {
    sealed: { from: "OPERATION" }
  },
  destinationOperationNextDestinationCompanyAddress: {
    sealed: { from: "OPERATION" }
  },
  destinationOperationNextDestinationCompanyContact: {
    sealed: { from: "OPERATION" }
  },
  destinationOperationNextDestinationCompanyPhone: {
    sealed: { from: "OPERATION" }
  },
  destinationOperationNextDestinationCompanyMail: {
    sealed: { from: "OPERATION" }
  },
  destinationOperationNextDestinationCap: {
    sealed: { from: "OPERATION" },
    required: {
      from: "OPERATION",
      when: bsda =>
        Boolean(bsda.destinationOperationNextDestinationCompanySiret)
    }
  },
  destinationOperationNextDestinationPlannedOperationCode: {
    sealed: { from: "OPERATION" },
    required: {
      from: "OPERATION",
      when: bsda =>
        Boolean(bsda.destinationOperationNextDestinationCompanySiret)
    }
  },
  transporterCompanyName: {
    sealed: { from: "TRANSPORT" },
    required: { from: "TRANSPORT", when: hasTransporter }
  },
  transporterCompanySiret: {
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: bsda => !bsda.transporterCompanyVatNumber && hasTransporter(bsda)
    }
  },
  transporterCompanyAddress: {
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: hasTransporter
    }
  },
  transporterCompanyContact: {
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: hasTransporter
    }
  },
  transporterCompanyPhone: {
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: hasTransporter
    }
  },
  transporterCompanyMail: {
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: hasTransporter
    }
  },
  transporterCompanyVatNumber: {
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: bsda => !bsda.transporterCompanySiret && hasTransporter(bsda)
    }
  },
  transporterCustomInfo: { sealed: { from: "TRANSPORT" } },
  transporterRecepisseIsExempted: {
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: hasTransporter
    }
  },
  transporterRecepisseNumber: {
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: bsda =>
        hasTransporter(bsda) &&
        !bsda.transporterRecepisseIsExempted &&
        !isForeignVat(bsda.transporterCompanyVatNumber)
    },
    name: "Transporteur: le numéro de récépissé",
    suffix: " L'établissement doit renseigner son récépissé dans Trackdéchets"
  },
  transporterRecepisseDepartment: {
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: bsda =>
        hasTransporter(bsda) &&
        !bsda.transporterRecepisseIsExempted &&
        !isForeignVat(bsda.transporterCompanyVatNumber)
    },
    name: "Transporteur: le département de récépissé",
    suffix: " L'établissement doit renseigner son récépissé dans Trackdéchets"
  },
  transporterRecepisseValidityLimit: {
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: bsda =>
        hasTransporter(bsda) &&
        !bsda.transporterRecepisseIsExempted &&
        !isForeignVat(bsda.transporterCompanyVatNumber)
    },
    name: "Transporteur: la date de validité du récépissé",
    suffix: " L'établissement doit renseigner son récépissé dans Trackdéchets"
  },
  transporterTransportMode: {
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: hasTransporter
    },
    name: "le mode de transport"
  },
  transporterTransportPlates: {
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: bsda =>
        hasTransporter(bsda) && bsda.transporterTransportMode === "ROAD"
    }
  },
  transporterTransportTakenOverAt: {
    sealed: { from: "TRANSPORT" }
  },
  workerIsDisabled: {
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerCompanyName: {
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerCompanySiret: {
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerCompanyAddress: {
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerCompanyContact: {
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerCompanyPhone: {
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerCompanyMail: {
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerWorkHasEmitterPaperSignature: {
    sealed: { from: "WORK" }
  },
  workerCertificationHasSubSectionFour: {
    sealed: { from: "WORK" }
  },
  workerCertificationHasSubSectionThree: {
    sealed: { from: "WORK" }
  },
  workerCertificationCertificationNumber: {
    sealed: { from: "WORK" },
    required: {
      from: "WORK",
      when: bsda => Boolean(bsda.workerCertificationHasSubSectionThree)
    }
  },
  workerCertificationValidityLimit: {
    sealed: { from: "WORK" },
    required: {
      from: "WORK",
      when: bsda => Boolean(bsda.workerCertificationHasSubSectionThree)
    }
  },
  workerCertificationOrganisation: {
    sealed: { from: "WORK" },
    required: {
      from: "WORK",
      when: bsda => Boolean(bsda.workerCertificationHasSubSectionThree)
    }
  },
  brokerCompanyName: { sealed: { from: "EMISSION" } },
  brokerCompanySiret: { sealed: { from: "EMISSION" } },
  brokerCompanyAddress: { sealed: { from: "EMISSION" } },
  brokerCompanyContact: { sealed: { from: "EMISSION" } },
  brokerCompanyPhone: { sealed: { from: "EMISSION" } },
  brokerCompanyMail: { sealed: { from: "EMISSION" } },
  brokerRecepisseNumber: { sealed: { from: "EMISSION" } },
  brokerRecepisseDepartment: {
    sealed: { from: "EMISSION" }
  },
  brokerRecepisseValidityLimit: {
    sealed: { from: "EMISSION" }
  },
  wasteCode: {
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" },
    name: "le code déchet"
  },
  wasteAdr: { sealed: { from: "WORK" } },
  wasteFamilyCode: {
    sealed: { from: "WORK" },
    required: { from: "WORK" },
    name: "le code famille"
  },
  wasteMaterialName: { sealed: { from: "WORK" }, required: { from: "WORK" } },
  wasteConsistence: {
    sealed: { from: "WORK" },
    required: { from: "WORK" },
    name: "la consistance"
  },
  wasteSealNumbers: { sealed: { from: "WORK" }, required: { from: "WORK" } },
  wastePop: { sealed: { from: "WORK" }, required: { from: "WORK" } },
  packagings: {
    sealed: { from: "WORK" },
    required: { from: "WORK" },
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
  weightIsEstimate: { sealed: { from: "WORK" }, required: { from: "WORK" } },
  weightValue: { sealed: { from: "WORK" }, required: { from: "WORK" } },
  grouping: { sealed: { from: "EMISSION" } },
  forwarding: { sealed: { from: "EMISSION" } },
  intermediaries: { sealed: { from: "TRANSPORT" } }
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
