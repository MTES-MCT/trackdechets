import {
  BsdaType,
  TransportMode,
  WasteAcceptationStatus
} from "@prisma/client";
import { BsdaSignatureType } from "../../generated/graphql/types";
import { ParsedZodBsda, ZodBsda } from "./schema";
import { isForeignVat } from "@td/constants";
import {
  getCurrentSignatureType,
  getSignatureAncestors,
  getUpdatedFields,
  getBsdaUserFunctions,
  BsdaUserFunctions
} from "./helpers";
import { getOperationModesFromOperationCode } from "../../common/operationModes";
import { capitalize } from "../../common/strings";
import { SealedFieldError } from "../../common/errors";
import { BsdaValidationContext } from "./types";

export type EditableBsdaFields = Required<
  Omit<
    ZodBsda,
    | "id"
    | "isDraft"
    | "isDeleted"
    | "emitterEmissionSignatureAuthor"
    | "emitterEmissionSignatureDate"
    | "destinationOperationSignatureAuthor"
    | "destinationOperationSignatureDate"
    | "transporterTransportSignatureAuthor"
    | "transporterTransportSignatureDate"
    | "workerWorkSignatureAuthor"
    | "workerWorkSignatureDate"
    | "intermediariesOrgIds"
    | "transportersOrgIds"
    | "transporterId"
  >
>;

export type RequiredCheckFn = (
  // BSDA sur lequel s'applique le parsing Zod
  bsda: ZodBsda
) => boolean;

export type SealedCheckFn = (
  // BSDA modifié, résultant de la fusion entre les données en base et les données de l'input
  bsda: ZodBsda,
  // BSDA persisté en base - avant modification
  persisted: ZodBsda,
  // Liste des "rôles" que l'utilisateur a sur le BSDA (ex: émetteur, transporteur, etc).
  // Permet de conditionner un check a un rôle. Ex: "Ce champ est modifiable mais uniquement par l'émetteur"
  userFunctions: BsdaUserFunctions
) => boolean;

// Permet de définir d'une même façon deux types de règles d'édition :
// - Vérification sur le vérrouillage des champs.
// - Vérification sur la présence requise des champs.
export type EditionRule<CheckFn> = {
  // Signature à partir de laquelle le champ est verrouillé / requis.
  from: BsdaSignatureType;
  // Condition supplémentaire à vérifier pour que le champ soit verrouillé / requis.
  when?: CheckFn;
  // A custom message at the end of the error
  suffix?: string;
};

export type EditionRules = {
  [Key in keyof EditableBsdaFields]: {
    // At what signature the field is sealed, and under which circumstances
    sealed: EditionRule<SealedCheckFn>;
    // At what signature the field is required, and under which circumstances. If absent, field is never required
    required?: EditionRule<RequiredCheckFn>;
    readableFieldName?: string; // A custom field name for errors
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
    readableFieldName: "le nom de l'entreprise émettrice",
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" }
  },
  emitterCompanySiret: {
    readableFieldName: "le SIRET de l'entreprise émettrice",
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION",
      when: bsda => !bsda.emitterIsPrivateIndividual
    }
  },
  emitterCompanyAddress: {
    readableFieldName: "l'adresse de l'entreprise émettrice",
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" }
  },
  emitterCompanyContact: {
    readableFieldName: "le nom de contact de l'entreprise émettrice",
    sealed: {
      from: "EMISSION",
      when: (bsda, _, userFunctions) => isSealedForEmitter(bsda, userFunctions)
    },
    required: {
      from: "EMISSION",
      when: bsda => !bsda.emitterIsPrivateIndividual
    }
  },
  emitterCompanyPhone: {
    readableFieldName: "le téléphone de l'entreprise émettrice",
    sealed: {
      from: "EMISSION",
      when: (bsda, _, userFunctions) => isSealedForEmitter(bsda, userFunctions)
    },
    required: {
      from: "EMISSION",
      when: bsda => !bsda.emitterIsPrivateIndividual
    }
  },
  emitterCompanyMail: {
    readableFieldName: "l'email de l'entreprise émettrice",
    sealed: {
      from: "EMISSION",
      when: (bsda, _, userFunctions) => isSealedForEmitter(bsda, userFunctions)
    },
    required: {
      from: "EMISSION",
      when: bsda => !bsda.emitterIsPrivateIndividual
    }
  },
  emitterCustomInfo: {
    readableFieldName:
      "les champs d'informations complémentaires de l'entreprise émettrice",
    sealed: {
      from: "EMISSION",
      when: (bsda, _, userFunctions) => isSealedForEmitter(bsda, userFunctions)
    }
  },
  emitterPickupSiteName: {
    readableFieldName: "le nom de l'adresse de chantier ou de collecte",
    sealed: {
      from: "EMISSION",
      when: (bsda, _, userFunctions) => isSealedForEmitter(bsda, userFunctions)
    }
  },
  emitterPickupSiteAddress: {
    readableFieldName: "l'adresse de collecte ou de chantier",
    sealed: {
      from: "EMISSION",
      when: (bsda, _, userFunctions) => isSealedForEmitter(bsda, userFunctions)
    }
  },
  emitterPickupSiteCity: {
    readableFieldName: "la ville de l'adresse de collecte ou de chantier",
    sealed: {
      from: "EMISSION",
      when: (bsda, _, userFunctions) => isSealedForEmitter(bsda, userFunctions)
    }
  },
  emitterPickupSitePostalCode: {
    readableFieldName: "le code postal de l'adresse de collecte ou de chantier",
    sealed: {
      from: "EMISSION",
      when: (bsda, _, userFunctions) => isSealedForEmitter(bsda, userFunctions)
    }
  },
  emitterPickupSiteInfos: {
    readableFieldName: "les informations de l'adresse de collecte",
    sealed: {
      from: "EMISSION",
      when: (bsda, _, userFunctions) => isSealedForEmitter(bsda, userFunctions)
    }
  },
  ecoOrganismeName: {
    readableFieldName: "le nom de l'éco-organisme",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: bsda => !!bsda.ecoOrganismeSiret
    }
  },
  ecoOrganismeSiret: {
    readableFieldName: "le SIRET de l'éco-organisme",
    sealed: { from: "TRANSPORT" }
  },
  destinationCompanyName: {
    readableFieldName: "le nom de l'entreprise de destination",
    sealed: {
      from: "EMISSION",
      when: isDestinationSealed
    },
    required: { from: "EMISSION" }
  },
  destinationCompanySiret: {
    readableFieldName: "le SIRET de l'entreprise de destination",
    sealed: {
      from: "EMISSION",
      when: isDestinationSealed
    },
    required: { from: "EMISSION" }
  },
  destinationCompanyAddress: {
    readableFieldName: "l'adresse de l'entreprise de destination",
    sealed: {
      from: "EMISSION",
      when: isDestinationSealed
    },
    required: { from: "EMISSION" }
  },
  destinationCompanyContact: {
    readableFieldName: "le nom de contact de l'entreprise de destination",
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION" }
  },
  destinationCompanyPhone: {
    readableFieldName: "le téléphone de l'entreprise de destination",
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION" }
  },
  destinationCompanyMail: {
    readableFieldName: "l'email de l'entreprise de destination",
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION" }
  },
  destinationCustomInfo: {
    readableFieldName:
      "les champs d'informations complémentaires de l'entreprise de destination",
    sealed: { from: "OPERATION" }
  },
  destinationCap: {
    readableFieldName: "le CAP du destinataire",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "EMISSION",
      when: bsda =>
        bsda.type !== BsdaType.COLLECTION_2710 &&
        !Boolean(bsda.destinationOperationNextDestinationCompanySiret)
    }
  },
  destinationPlannedOperationCode: {
    readableFieldName: "le code d'opération prévu",
    sealed: { from: "TRANSPORT" },
    required: { from: "EMISSION" }
  },
  destinationReceptionDate: {
    readableFieldName: "la date de réception",
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION" }
  },
  destinationReceptionWeight: {
    readableFieldName: "le poids du déchet",
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION" }
  },
  destinationReceptionAcceptationStatus: {
    readableFieldName: "l'acceptation du déchet",
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION" }
  },
  destinationReceptionRefusalReason: {
    readableFieldName: "la raison du refus du déchet",
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION", when: isRefusedOrPartiallyRefused }
  },
  destinationOperationCode: {
    readableFieldName: "le code d'opération réalisé",
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION", when: isNotRefused }
  },
  destinationOperationMode: {
    readableFieldName: "le mode de traitement",
    sealed: { from: "OPERATION" },
    required: {
      from: "OPERATION",
      when: bsda => {
        if (bsda.destinationOperationCode) {
          const modes = getOperationModesFromOperationCode(
            bsda.destinationOperationCode
          );
          if (modes.length && !bsda.destinationOperationMode) {
            return true;
          }
        }
        return false;
      }
    }
  },
  destinationOperationDescription: {
    readableFieldName: "la description de l'opération réalisée",
    sealed: { from: "OPERATION" }
  },
  destinationOperationDate: {
    readableFieldName: "la date de l'opération",
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION", when: isNotRefused }
  },
  destinationOperationNextDestinationCompanyName: {
    readableFieldName: "le nom de l'exutoire",
    sealed: { from: "OPERATION" }
  },
  destinationOperationNextDestinationCompanySiret: {
    readableFieldName: "le SIRET de l'exutoire",
    sealed: { from: "OPERATION" }
  },
  destinationOperationNextDestinationCompanyVatNumber: {
    readableFieldName: "le numéro de TVA de l'exutoire",
    sealed: { from: "OPERATION" }
  },
  destinationOperationNextDestinationCompanyAddress: {
    readableFieldName: "l'adresse de l'exutoire",
    sealed: { from: "OPERATION" },
    required: {
      from: "EMISSION",
      when: bsda =>
        Boolean(bsda.destinationOperationNextDestinationCompanySiret)
    }
  },
  destinationOperationNextDestinationCompanyContact: {
    readableFieldName: "le nom de contact de l'exutoire",
    sealed: { from: "OPERATION" },
    required: {
      from: "EMISSION",
      when: bsda =>
        Boolean(bsda.destinationOperationNextDestinationCompanySiret)
    }
  },
  destinationOperationNextDestinationCompanyPhone: {
    readableFieldName: "le téléphone de l'exutoire",
    sealed: { from: "OPERATION" },
    required: {
      from: "EMISSION",
      when: bsda =>
        Boolean(bsda.destinationOperationNextDestinationCompanySiret)
    }
  },
  destinationOperationNextDestinationCompanyMail: {
    readableFieldName: "l'email de l'exutoire",
    sealed: { from: "OPERATION" },
    required: {
      from: "EMISSION",
      when: bsda =>
        Boolean(bsda.destinationOperationNextDestinationCompanySiret)
    }
  },
  destinationOperationNextDestinationCap: {
    readableFieldName: "le CAP de l'exutoire",
    sealed: { from: "OPERATION" },
    required: {
      from: "EMISSION",
      when: bsda =>
        Boolean(bsda.destinationOperationNextDestinationCompanySiret)
    }
  },
  destinationOperationNextDestinationPlannedOperationCode: {
    readableFieldName: "le code d'opération de l'exutoire",
    sealed: { from: "OPERATION" },
    required: {
      from: "EMISSION",
      when: bsda =>
        Boolean(bsda.destinationOperationNextDestinationCompanySiret)
    }
  },
  transporterCompanyName: {
    readableFieldName: "le nom du transporteur",
    sealed: { from: "TRANSPORT" },
    required: { from: "TRANSPORT", when: hasTransporter }
  },
  transporterCompanySiret: {
    readableFieldName: "le SIRET du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "EMISSION",
      when: bsda => {
        // Transporter is required if there is no worker and the emitter is a private individual.
        // This is to avoid usage of an OTHER_COLLECTIONS BSDA instead of a COLLECTION_2710
        if (
          bsda.emitterIsPrivateIndividual &&
          bsda.type === BsdaType.OTHER_COLLECTIONS &&
          bsda.workerIsDisabled &&
          !bsda.transporterCompanyVatNumber
        ) {
          return true;
        }

        // Otherwise, the transporter is only required for the transporter signature.
        // No specific check needed as anyway he cannot sign without being part of the bsda
        return false;
      },
      suffix:
        "Si l'émetteur est un particulier et qu'aucune entreprise de travaux n'a été visée, l'ajout d'un transporteur est obligatoire."
    }
  },
  transporterCompanyAddress: {
    readableFieldName: "l'adresse du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: hasTransporter
    }
  },
  transporterCompanyContact: {
    readableFieldName: "le nom de contact du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: hasTransporter
    }
  },
  transporterCompanyPhone: {
    readableFieldName: "le téléphone du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: hasTransporter
    }
  },
  transporterCompanyMail: {
    readableFieldName: "l'email du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: hasTransporter
    }
  },
  transporterCompanyVatNumber: {
    readableFieldName: "le numéro de TVA du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "EMISSION",
      when: bsda => {
        // Transporter is required if there is no worker and the emitter is a private individual.
        // This is to avoid usage of an OTHER_COLLECTIONS BSDA instead of a COLLECTION_2710
        if (
          bsda.emitterIsPrivateIndividual &&
          bsda.type === BsdaType.OTHER_COLLECTIONS &&
          bsda.workerIsDisabled &&
          !bsda.transporterCompanySiret
        ) {
          return true;
        }

        return false;
      }
    }
  },
  transporterCustomInfo: {
    readableFieldName:
      "les champs d'informations complémentaires du transporteur",
    sealed: { from: "TRANSPORT" }
  },
  transporterRecepisseIsExempted: {
    readableFieldName: "l'exemption de récépissé du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: hasTransporter
    }
  },
  transporterRecepisseNumber: {
    readableFieldName: "le numéro de récépissé du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: requireTransporterRecepisse,
      suffix: "L'établissement doit renseigner son récépissé dans Trackdéchets"
    }
  },
  transporterRecepisseDepartment: {
    readableFieldName: "le département de récépissé du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: requireTransporterRecepisse,
      suffix: "L'établissement doit renseigner son récépissé dans Trackdéchets"
    }
  },
  transporterRecepisseValidityLimit: {
    readableFieldName: "la date de validaté du récépissé du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: requireTransporterRecepisse,
      suffix: "L'établissement doit renseigner son récépissé dans Trackdéchets"
    }
  },
  transporterTransportMode: {
    readableFieldName: "le mode de transport",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: hasTransporter
    }
  },
  transporterTransportPlates: {
    readableFieldName: "l'immatriculation du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: bsda =>
        hasTransporter(bsda) && bsda.transporterTransportMode === "ROAD"
    }
  },
  transporterTransportTakenOverAt: {
    readableFieldName: "la date d'enlèvement du transporteur",
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
    readableFieldName: "le nom de l'entreprise de travaux",
    sealed: {
      from: "EMISSION",
      when: (bsda, _, userFunctions) => isSealedForEmitter(bsda, userFunctions)
    },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerCompanySiret: {
    readableFieldName: "le SIRET de l'entreprise de travaux",
    sealed: {
      from: "EMISSION",
      when: (bsda, _, userFunctions) => isSealedForEmitter(bsda, userFunctions)
    },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerCompanyAddress: {
    readableFieldName: "l'adresse de l'entreprise de travaux",
    sealed: {
      from: "EMISSION",
      when: (bsda, _, userFunctions) => isSealedForEmitter(bsda, userFunctions)
    },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerCompanyContact: {
    readableFieldName: "le nom de contact de l'entreprise de travaux",
    sealed: { from: "WORK" },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerCompanyPhone: {
    readableFieldName: "le téléphone de l'entreprise de travaux",
    sealed: { from: "WORK" },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerCompanyMail: {
    readableFieldName: "l'email de l'entreprise de travaux",
    sealed: { from: "WORK" },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerWorkHasEmitterPaperSignature: {
    sealed: { from: "WORK" }
  },
  workerCertificationHasSubSectionFour: {
    readableFieldName: "travaux relevant de la sous-section 4",
    sealed: { from: "WORK" }
  },
  workerCertificationHasSubSectionThree: {
    readableFieldName: "travaux relevant de la sous-section 3",
    sealed: { from: "WORK" }
  },
  workerCertificationCertificationNumber: {
    readableFieldName: "le numéro de certification de l'entreprise de travaux",
    sealed: { from: "WORK" },
    required: {
      from: "WORK",
      when: bsda => Boolean(bsda.workerCertificationHasSubSectionThree)
    }
  },
  workerCertificationValidityLimit: {
    readableFieldName:
      "la date de validité de la certification de l'entreprise de travaux",
    sealed: { from: "WORK" },
    required: {
      from: "WORK",
      when: bsda => Boolean(bsda.workerCertificationHasSubSectionThree)
    }
  },
  workerCertificationOrganisation: {
    readableFieldName:
      "l'organisme de la certification de l'entreprise de travaux",
    sealed: { from: "WORK" },
    required: {
      from: "WORK",
      when: bsda => Boolean(bsda.workerCertificationHasSubSectionThree)
    }
  },
  brokerCompanyName: {
    readableFieldName: "le nom du courtier",
    sealed: { from: "OPERATION" }
  },
  brokerCompanySiret: {
    readableFieldName: "le SIRET du courtier",
    sealed: { from: "OPERATION" }
  },
  brokerCompanyAddress: {
    readableFieldName: "l'adresse du courtier",
    sealed: { from: "OPERATION" }
  },
  brokerCompanyContact: {
    readableFieldName: "le nom de contact du courtier",
    sealed: { from: "OPERATION" }
  },
  brokerCompanyPhone: {
    readableFieldName: "le téléphone du courtier",
    sealed: { from: "OPERATION" }
  },
  brokerCompanyMail: {
    readableFieldName: "le mail du courtier",
    sealed: { from: "OPERATION" }
  },
  brokerRecepisseNumber: {
    readableFieldName: "le numéro de récépissé du courtier",
    sealed: { from: "OPERATION" }
  },
  brokerRecepisseDepartment: {
    readableFieldName: "le département du récépissé du courtier",
    sealed: { from: "OPERATION" }
  },
  brokerRecepisseValidityLimit: {
    readableFieldName:
      "la date de validité de la certification de l'entreprise de travaux",
    sealed: { from: "OPERATION" }
  },
  wasteCode: {
    sealed: {
      from: "EMISSION",
      when: (bsda, _, userFunctions) => isSealedForEmitter(bsda, userFunctions)
    },
    required: { from: "EMISSION" },
    readableFieldName: "le code déchet"
  },
  wasteAdr: { readableFieldName: "la mention ADR", sealed: { from: "WORK" } },
  wasteFamilyCode: {
    sealed: { from: "WORK" },
    required: { from: "WORK" },
    readableFieldName: "le code famille"
  },
  wasteMaterialName: {
    readableFieldName: "le nom de matériau",
    sealed: { from: "WORK" },
    required: { from: "WORK" }
  },
  wasteConsistence: {
    sealed: { from: "WORK" },
    required: { from: "WORK" },
    readableFieldName: "la consistance"
  },
  wasteSealNumbers: {
    readableFieldName: "le(s) numéro(s) de scellés",
    sealed: { from: "WORK" },
    required: {
      from: "WORK",
      when: bsda => bsda.type !== BsdaType.COLLECTION_2710
    }
  },
  wastePop: {
    readableFieldName: "le champ sur les polluants organiques persistants",
    sealed: { from: "WORK" },
    required: { from: "WORK" }
  },
  packagings: {
    sealed: { from: "WORK" },
    required: {
      from: "WORK"
    },
    readableFieldName: "le conditionnement"
  },
  weightIsEstimate: {
    readableFieldName: "le champ pour indiquer sile poids est estimé",
    sealed: { from: "WORK" },
    required: { from: "WORK" }
  },
  weightValue: {
    readableFieldName: "le poids",
    sealed: { from: "WORK" },
    required: { from: "WORK" }
  },
  grouping: { sealed: { from: "EMISSION" } },
  forwarding: { sealed: { from: "EMISSION" } },
  intermediaries: {
    readableFieldName: "les intermédiaires",
    sealed: { from: "TRANSPORT" }
  }
};

function hasWorker(bsda: ZodBsda) {
  return bsda.type === BsdaType.OTHER_COLLECTIONS && !bsda.workerIsDisabled;
}

function hasTransporter(bsda: ZodBsda) {
  return bsda.type !== BsdaType.COLLECTION_2710;
}

function requireTransporterRecepisse(bsda: ZodBsda) {
  return (
    hasTransporter(bsda) &&
    !bsda.transporterRecepisseIsExempted &&
    bsda.transporterTransportMode === TransportMode.ROAD &&
    !isForeignVat(bsda.transporterCompanyVatNumber)
  );
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

/**
 * The emitter has special rights to edit several fields after he signed,
 * and until other signatures are applied.
 */
function isSealedForEmitter(bsda: ZodBsda, { isEmitter }: BsdaUserFunctions) {
  const isSealedForEmitter = hasWorker(bsda)
    ? bsda.workerWorkSignatureDate != null
    : bsda.transporterTransportSignatureDate != null;

  if (isEmitter && !isSealedForEmitter) {
    return false;
  }

  return true;
}

function isDestinationSealed(
  bsda: ZodBsda,
  persisted: ZodBsda,
  userFunctions: BsdaUserFunctions
) {
  if (!isSealedForEmitter(bsda, userFunctions)) {
    return false;
  }

  // If I am worker, transporter or destination and the transporter hasn't signed,
  // then I can either add or remove a nextDestination. To do so I need to edit the destination.
  const isAddingNextDestination =
    !persisted?.destinationOperationNextDestinationCompanySiret &&
    bsda.destinationOperationNextDestinationCompanySiret;
  const isRemovingNextDestination =
    persisted?.destinationOperationNextDestinationCompanySiret &&
    !bsda.destinationOperationNextDestinationCompanySiret;
  if (
    (userFunctions.isEmitter ||
      userFunctions.isWorker ||
      userFunctions.isTransporter ||
      userFunctions.isDestination) &&
    bsda.transporterTransportSignatureDate == null &&
    (isAddingNextDestination || isRemovingNextDestination)
  ) {
    return false;
  }

  return true;
}

export type RulesEntries = {
  [K in keyof EditionRules]: [K, EditionRules[K]];
}[keyof EditionRules][];

/**
 * Cette fonction permet de vérifier qu'un utilisateur n'est pas
 * en train d'essayer de modifier des données qui ont été verrouillée
 * par une signature
 * @param bsda BSDA persisté en base
 * @param update Modifications qui sont apportées par l'input
 * @param user Utilisateur qui effectue la modification
 */
export async function checkSealedFields(
  bsda: ZodBsda,
  update: ZodBsda,
  context: BsdaValidationContext
) {
  const sealedFieldErrors: string[] = [];

  const updatedFields = getUpdatedFields(bsda, update);

  const currentSignatureType =
    context.currentSignatureType ?? getCurrentSignatureType(bsda);

  // Some signatures may be skipped, so always check all the hierarchy
  const signaturesToCheck = getSignatureAncestors(currentSignatureType);

  const userFunctions = await getBsdaUserFunctions(context.user, bsda);

  for (const field of updatedFields) {
    const rule = editionRules[field as keyof EditableBsdaFields];
    const sealedRule = {
      from: rule.sealed.from,
      when: rule.sealed.when ?? (() => true), // Default to true
      suffix: rule.sealed.suffix
    };

    const fieldDescription = rule.readableFieldName
      ? capitalize(rule.readableFieldName)
      : `Le champ ${field}`;

    const isSealed =
      signaturesToCheck.includes(sealedRule.from) &&
      sealedRule.when({ ...bsda, ...update }, bsda, userFunctions);

    if (isSealed) {
      sealedFieldErrors.push(
        [
          `${fieldDescription} a été vérouillé via signature et ne peut pas être modifié.`,
          sealedRule.suffix
        ]
          .filter(Boolean)
          .join(" ")
      );
    }
  }

  if (sealedFieldErrors?.length > 0) {
    throw new SealedFieldError([...new Set(sealedFieldErrors)]);
  }

  return Promise.resolve(updatedFields);
}

export async function getSealedFields(
  bsda: ParsedZodBsda,
  context: BsdaValidationContext
) {
  const currentSignatureType =
    context.currentSignatureType ?? getCurrentSignatureType(bsda);
  // Some signatures may be skipped, so always check all the hierarchy
  const signaturesToCheck = getSignatureAncestors(currentSignatureType);

  const userFunctions = await getBsdaUserFunctions(context.user, bsda);

  const sealedFields = Object.entries(editionRules)
    .filter(
      ([_, rule]) =>
        signaturesToCheck.includes(rule.sealed.from) &&
        (!rule.sealed.when || rule.sealed.when(bsda, bsda, userFunctions))
    )
    .map(([field]) => field as keyof EditionRules);

  return sealedFields;
}
