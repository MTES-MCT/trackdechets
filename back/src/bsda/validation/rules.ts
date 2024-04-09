import {
  BsdaType,
  TransportMode,
  WasteAcceptationStatus
} from "@prisma/client";
import { ParsedZodBsda, ZodBsda, ZodBsdaTransporter } from "./schema";
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
import { AllBsdaSignatureType } from "../types";

// Liste des champs éditables sur l'objet Bsda
export type BsdaEditableFields = Required<
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
  >
>;

// Liste des champs éditables sur l'objet BsdaTransporter
export type BsdaTransporterEditableFields = Required<
  Omit<
    ZodBsdaTransporter,
    | "number"
    | "transporterTransportSignatureAuthor"
    | "transporterTransportSignatureDate"
  >
>;

type RuleContext<T extends ZodBsda | ZodBsdaTransporter> = {
  // BSDA persisté en base - avant modification
  persisted: T;
  // Liste des "rôles" que l'utilisateur a sur le BSDA (ex: émetteur, transporteur, etc).
  // Permet de conditionner un check a un rôle. Ex: "Ce champ est modifiable mais uniquement par l'émetteur"
  userFunctions: BsdaUserFunctions;
};

// Fonction permettant de définir une signature de champ requis ou
// verrouilage de champ à partir des données du BSDA et du contexte
type GetBsdaSignatureTypeFn<T extends ZodBsda | ZodBsdaTransporter> = (
  bsda: T,
  ruleContext?: RuleContext<T>
) => AllBsdaSignatureType | undefined;

// Règle d'édition qui permet de définir à partir de quelle signature
// un champ est verrouillé / requis avec une config contenant un paramètre
// optionnel `when`
type EditionRule<T extends ZodBsda | ZodBsdaTransporter> = {
  // Signature à partir de laquelle le champ est requis ou fonction
  // permettant de calculer cette signature
  from: AllBsdaSignatureType | GetBsdaSignatureTypeFn<T>;
  // Condition supplémentaire à vérifier pour que le champ soit requis.
  when?: (bsda: T) => boolean;
  customErrorMessage?: string;
};

export type EditionRules<
  T extends ZodBsda | ZodBsdaTransporter,
  E extends BsdaEditableFields | BsdaTransporterEditableFields
> = {
  [Key in keyof E]: {
    // At what signature the field is sealed, and under which circumstances
    sealed: EditionRule<T>;
    // At what signature the field is required, and under which circumstances. If absent, field is never required
    required?: EditionRule<T>;
    readableFieldName?: string; // A custom field name for errors
  };
};

type BsdaEditionRules = EditionRules<ZodBsda, BsdaEditableFields>;

type BsdaTransporterEditionRules = EditionRules<
  ZodBsdaTransporter,
  BsdaTransporterEditableFields
>;

/**
 * Régle de verrouillage des champs définie à partir d'une fonction.
 * Un champ appliquant cette règle est verrouillé à partir de la
 * signature émetteur sauf si l'utilisateur est l'émetteur, auquel cas
 * il peut encore modifier le champ jusqu'à la signature suivante.
 */
const sealedFromEissionExceptForEmitter: GetBsdaSignatureTypeFn<ZodBsda> = (
  _,
  context
) => {
  const { isEmitter } = context!.userFunctions;
  return isEmitter ? "WORK" : "EMISSION";
};

/**
 * Règle de verrouillage des champs définie à partir d'une fonction.
 * Un champ appliquant cette règle est vérouillée à partir de la
 * signature émetteur sauf si l'utilisateur est en train d'ajouter ou supprimer
 * un entreposage provisoire, auquel cas le champ est encore modifiable
 * jusqu'à la signature du transporteur.
 */
const sealedFromEmissionExceptAddOrRemoveNextDestination: GetBsdaSignatureTypeFn<
  ZodBsda
> = (bsda, context) => {
  const { isEmitter, isWorker, isTransporter, isDestination } =
    context!.userFunctions;
  const persisted = context!.persisted;

  const isAddingNextDestination =
    !persisted?.destinationOperationNextDestinationCompanySiret &&
    bsda.destinationOperationNextDestinationCompanySiret;
  const isRemovingNextDestination =
    persisted?.destinationOperationNextDestinationCompanySiret &&
    !bsda.destinationOperationNextDestinationCompanySiret;

  // If I am a worker, a transporter or destination and the transporter hasn't signed,
  // then I can either add or remove a nextDestination. To do so I need to edit the destination.
  if (
    (isEmitter || isWorker || isTransporter || isDestination) &&
    (isAddingNextDestination || isRemovingNextDestination)
  ) {
    return "TRANSPORT";
  }

  return isEmitter ? "WORK" : "EMISSION";
};

function transporterSignature(
  transporter: ZodBsdaTransporter
): AllBsdaSignatureType {
  if (transporter.number && transporter.number > 1) {
    return `TRANSPORT_${transporter.number}` as AllBsdaSignatureType;
  }
  return "TRANSPORT";
}

export const bsdaTransporterEditionRules: BsdaTransporterEditionRules = {
  id: {
    readableFieldName: "le transporteur",
    sealed: { from: transporterSignature }
  },
  bsdaId: {
    readableFieldName: "le BSDA associé au transporteur",
    sealed: { from: transporterSignature }
  },
  transporterCompanyName: {
    readableFieldName: "le nom du transporteur",
    sealed: {
      from: transporterSignature
    },
    required: { from: transporterSignature }
  },
  transporterCompanySiret: {
    readableFieldName: "le SIRET du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature,
      when: transporter => !transporter.transporterCompanyVatNumber
    }
  },
  transporterCompanyAddress: {
    readableFieldName: "l'adresse du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature
    }
  },
  transporterCompanyContact: {
    readableFieldName: "le nom de contact du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature
    }
  },
  transporterCompanyPhone: {
    readableFieldName: "le téléphone du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature
    }
  },
  transporterCompanyMail: {
    readableFieldName: "l'email du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature
    }
  },
  transporterCompanyVatNumber: {
    readableFieldName: "le numéro de TVA du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature,
      when: transporter => !transporter.transporterCompanySiret
    }
  },
  transporterCustomInfo: {
    readableFieldName:
      "les champs d'informations complémentaires du transporteur",
    sealed: { from: transporterSignature }
  },
  transporterRecepisseIsExempted: {
    readableFieldName: "l'exemption de récépissé du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature
    }
  },
  transporterRecepisseNumber: {
    readableFieldName: "le numéro de récépissé du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature,
      when: requireTransporterRecepisse,
      customErrorMessage:
        "L'établissement doit renseigner son récépissé dans Trackdéchets"
    }
  },
  transporterRecepisseDepartment: {
    readableFieldName: "le département de récépissé du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature,
      when: requireTransporterRecepisse,
      customErrorMessage:
        "L'établissement doit renseigner son récépissé dans Trackdéchets"
    }
  },
  transporterRecepisseValidityLimit: {
    readableFieldName: "la date de validité du récépissé du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature,
      when: requireTransporterRecepisse,
      customErrorMessage:
        "L'établissement doit renseigner son récépissé dans Trackdéchets"
    }
  },
  transporterTransportMode: {
    readableFieldName: "le mode de transport",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature
    }
  },
  transporterTransportPlates: {
    readableFieldName: "l'immatriculation du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature,
      when: bsda => bsda.transporterTransportMode === "ROAD"
    }
  },
  transporterTransportTakenOverAt: {
    readableFieldName: "la date d'enlèvement du transporteur",
    sealed: { from: transporterSignature }
  }
};

export const bsdaEditionRules: BsdaEditionRules = {
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
      from: sealedFromEissionExceptForEmitter
    },
    required: {
      from: "EMISSION",
      when: bsda => !bsda.emitterIsPrivateIndividual
    }
  },
  emitterCompanyPhone: {
    readableFieldName: "le téléphone de l'entreprise émettrice",
    sealed: {
      from: sealedFromEissionExceptForEmitter
    },
    required: {
      from: "EMISSION",
      when: bsda => !bsda.emitterIsPrivateIndividual
    }
  },
  emitterCompanyMail: {
    readableFieldName: "l'email de l'entreprise émettrice",
    sealed: {
      from: sealedFromEissionExceptForEmitter
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
      from: sealedFromEissionExceptForEmitter
    }
  },
  emitterPickupSiteName: {
    readableFieldName: "le nom de l'adresse de chantier ou de collecte",
    sealed: {
      from: sealedFromEissionExceptForEmitter
    }
  },
  emitterPickupSiteAddress: {
    readableFieldName: "l'adresse de collecte ou de chantier",
    sealed: {
      from: sealedFromEissionExceptForEmitter
    }
  },
  emitterPickupSiteCity: {
    readableFieldName: "la ville de l'adresse de collecte ou de chantier",
    sealed: {
      from: sealedFromEissionExceptForEmitter
    }
  },
  emitterPickupSitePostalCode: {
    readableFieldName: "le code postal de l'adresse de collecte ou de chantier",
    sealed: {
      from: sealedFromEissionExceptForEmitter
    }
  },
  emitterPickupSiteInfos: {
    readableFieldName: "les informations de l'adresse de collecte",
    sealed: {
      from: sealedFromEissionExceptForEmitter
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
      from: sealedFromEmissionExceptAddOrRemoveNextDestination
    },
    required: { from: "EMISSION" }
  },
  destinationCompanySiret: {
    readableFieldName: "le SIRET de l'entreprise de destination",
    sealed: {
      from: sealedFromEmissionExceptAddOrRemoveNextDestination
    },
    required: { from: "EMISSION" }
  },
  destinationCompanyAddress: {
    readableFieldName: "l'adresse de l'entreprise de destination",
    sealed: {
      from: sealedFromEmissionExceptAddOrRemoveNextDestination
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
    sealed: { from: sealedFromEmissionExceptAddOrRemoveNextDestination },
    required: {
      from: "EMISSION",
      when: bsda =>
        bsda.type !== BsdaType.COLLECTION_2710 &&
        !Boolean(bsda.destinationOperationNextDestinationCompanySiret)
    }
  },
  destinationPlannedOperationCode: {
    readableFieldName: "le code d'opération prévu",
    sealed: { from: sealedFromEmissionExceptAddOrRemoveNextDestination },
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
  transporters: {
    readableFieldName: "la liste des transporteurs",
    sealed: {
      // Le verrouillage des champs en fonction des signatures est géré plus finement
      // dans bsdaTransporterEditionRules
      from: "TRANSPORT_5"
    },
    required: {
      from: bsda => {
        if (bsda.type === BsdaType.COLLECTION_2710) {
          // Bordereau de collecte en déchetterie sans transporteur
          return undefined;
        }
        // Transporter is required if there is no worker and the emitter is a private individual.
        // This is to avoid usage of an OTHER_COLLECTIONS BSDA instead of a COLLECTION_2710
        if (
          bsda.emitterIsPrivateIndividual &&
          bsda.type === BsdaType.OTHER_COLLECTIONS &&
          bsda.workerIsDisabled
        ) {
          return "EMISSION";
        }
        return "TRANSPORT";
      },
      customErrorMessage:
        // FIXME ce message ne s'applique que pour un des cas
        "Si l'émetteur est un particulier et qu'aucune entreprise de travaux n'a été visée, l'ajout d'un transporteur est obligatoire."
    }
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
      from: sealedFromEissionExceptForEmitter
    },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerCompanySiret: {
    readableFieldName: "le SIRET de l'entreprise de travaux",
    sealed: {
      from: sealedFromEissionExceptForEmitter
    },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerCompanyAddress: {
    readableFieldName: "l'adresse de l'entreprise de travaux",
    sealed: {
      from: sealedFromEissionExceptForEmitter
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
      from: sealedFromEissionExceptForEmitter
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
    sealed: { from: "WORK" }
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

function requireTransporterRecepisse(transporter: ZodBsdaTransporter) {
  return (
    !transporter.transporterRecepisseIsExempted &&
    transporter.transporterTransportMode === TransportMode.ROAD &&
    !isForeignVat(transporter.transporterCompanyVatNumber)
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
 * Cette fonction permet de vérifier qu'un utilisateur n'est pas
 * en train d'essayer de modifier des données qui ont été verrouillée
 * par une signature
 * @param persisted BSDA persisté en base
 * @param bsda BSDA avec les modifications apportées par l'input
 * @param user Utilisateur qui effectue la modification
 */
export async function checkBsdaSealedFields(
  persisted: ZodBsda,
  bsda: ZodBsda,
  context: BsdaValidationContext
) {
  const sealedFieldErrors: string[] = [];

  const updatedFields = getUpdatedFields(persisted, bsda);

  const currentSignatureType =
    context.currentSignatureType ?? getCurrentSignatureType(persisted);

  // Some signatures may be skipped, so always check all the hierarchy
  const signaturesToCheck = getSignatureAncestors(currentSignatureType);

  const userFunctions = await getBsdaUserFunctions(context.user, persisted);

  for (const field of updatedFields) {
    const { readableFieldName, sealed: sealedRule } =
      bsdaEditionRules[field as keyof BsdaEditableFields];

    const fieldDescription = readableFieldName
      ? capitalize(readableFieldName)
      : `Le champ ${field}`;

    const isSealed = isBsdaFieldSealed(sealedRule, bsda, signaturesToCheck, {
      persisted,
      userFunctions
    });

    if (isSealed) {
      sealedFieldErrors.push(
        [
          `${fieldDescription} a été vérouillé via signature et ne peut pas être modifié.`,
          sealedRule.customErrorMessage
        ]
          .filter(Boolean)
          .join(" ")
      );
    }
  }

  if (updatedFields.includes("transporters")) {
    // Une modification a eu lieu dans le tableau des transporteurs. Il peut s'agir :
    // Cas 1 : d'une modification des identifiants des transporteurs visés via le champ BsdaInput.transporters
    // Cas 2 : d'une modification du premier transporteur via le champ BsdaInput.transporter

    const persistedTransporters = persisted.transporters ?? [];
    const updatedTransporters = bsda.transporters ?? [];

    // Vérification du cas 1
    persistedTransporters.forEach((persistedTransporter, idx) => {
      const updatedTransporter = updatedTransporters[idx];
      if (persistedTransporter.id !== updatedTransporter?.id) {
        const rule = bsdaTransporterEditionRules.id;
        const isSealed = isBsdaTransporterFieldSealed(
          rule.sealed,
          { ...updatedTransporter, number: idx + 1 },
          signaturesToCheck
        );

        if (isSealed) {
          sealedFieldErrors.push(
            `Le transporteur n°${
              idx + 1
            } a déjà signé le BSDA, il ne peut pas être supprimé ou modifié`
          );
        }
      }
    });

    // Vérification du cas n°2
    const firstPersistedTransporter = persistedTransporters[0];
    const firstUpdatedTransporter = updatedTransporters[0];

    if (
      firstPersistedTransporter &&
      firstUpdatedTransporter &&
      firstPersistedTransporter.id === firstUpdatedTransporter.id
    ) {
      const transporterUpdatedFields = getUpdatedFields(
        persistedTransporters[0],
        updatedTransporters[0]
      );

      for (const transporterUpdatedField of transporterUpdatedFields) {
        const rule =
          bsdaTransporterEditionRules[
            transporterUpdatedField as keyof BsdaTransporterEditableFields
          ];

        if (rule) {
          const isSealed = isBsdaTransporterFieldSealed(
            rule.sealed,
            { ...updatedTransporters[0], number: 1 },
            signaturesToCheck,
            {
              persisted: { ...persistedTransporters[0], number: 1 },
              userFunctions
            }
          );

          const fieldDescription = rule.readableFieldName
            ? capitalize(rule.readableFieldName)
            : `Le champ ${transporterUpdatedField}`;

          if (isSealed) {
            sealedFieldErrors.push(
              `${fieldDescription} n°1 a été vérouillé via signature et ne peut pas être modifié.`
            );
          }
        }
      }
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

  const sealedFields = Object.entries(bsdaEditionRules)
    .filter(([_, { sealed: sealedRule }]) => {
      const isSealed = isBsdaFieldSealed(sealedRule, bsda, signaturesToCheck, {
        persisted: bsda,
        userFunctions
      });

      return isSealed;
    })
    .map(([field]) => field as keyof BsdaEditionRules);

  return sealedFields;
}

// Fonction utilitaire générique permettant d'appliquer une règle
// de verrouillage de champ ou de champ requis
// définie soit à partir d'une fonction soit à partir d'une config
function isRuleApplied<T extends ZodBsda | ZodBsdaTransporter>(
  rule: EditionRule<T>,
  resource: T,
  signatures: AllBsdaSignatureType[],
  context?: RuleContext<T>
) {
  const from =
    typeof rule.from === "function" ? rule.from(resource, context) : rule.from;

  const isApplied =
    from &&
    signatures.includes(from) &&
    (rule.when === undefined || rule.when(resource));

  return isApplied;
}

function isBsdaFieldSealed(
  rule: EditionRule<ZodBsda>,
  bsda: ZodBsda,
  signatures: AllBsdaSignatureType[],
  context?: RuleContext<ZodBsda>
) {
  return isRuleApplied(rule, bsda, signatures, context);
}

function isBsdaTransporterFieldSealed(
  rule: EditionRule<ZodBsdaTransporter>,
  bsdaTransporter: ZodBsdaTransporter,
  signatures: AllBsdaSignatureType[],
  context?: RuleContext<ZodBsdaTransporter>
) {
  return isRuleApplied(rule, bsdaTransporter, signatures, context);
}

export function isBsdaFieldRequired(
  rule: EditionRule<ZodBsda>,
  bsda: ZodBsda,
  signatures: AllBsdaSignatureType[]
) {
  return isRuleApplied(rule, bsda, signatures);
}

export function isBsdaTransporterFieldRequired(
  rule: EditionRule<ZodBsdaTransporter>,
  bsdaTransporter: ZodBsdaTransporter,
  signatures: AllBsdaSignatureType[]
) {
  return isRuleApplied(rule, bsdaTransporter, signatures);
}
