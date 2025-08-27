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
import { v20250201 } from "../../common/validation";
import { BsdaSignatureType } from "@td/codegen-back";

// Liste des champs éditables sur l'objet Bsda
export type BsdaEditableFields = Required<
  Omit<
    ZodBsda,
    | "id"
    | "createdAt"
    | "isDraft"
    | "isDeleted"
    | "emitterEmissionSignatureAuthor"
    | "emitterEmissionSignatureDate"
    | "destinationOperationSignatureAuthor"
    | "destinationOperationSignatureDate"
    | "destinationReceptionSignatureDate"
    | "destinationReceptionSignatureAuthor"
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
  when?: (
    bsvhu: T,
    currentSignatureType: AllBsdaSignatureType | undefined
  ) => boolean;
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
const sealedFromEmissionExceptForEmitter: GetBsdaSignatureTypeFn<ZodBsda> = (
  _,
  context
) => {
  const { isEmitter } = context!.userFunctions;
  return isEmitter ? "WORK" : "EMISSION";
};

/**
 * Règle de verrouillage des champs définie à partir d'une fonction.
 * Un champ appliquant cette règle est verrouillé à partir de la
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

/**
 * Renvoie la signature émetteur s'il n'y a pas d'entreprise de travaux sur le BSDA.
 * Sinon, renvoie la signature de l'entreprise de travaux.
 */
const fromWorkOrEmissionWhenThereIsNoWorker: GetBsdaSignatureTypeFn<ZodBsda> = (
  bsda,
  _
) => {
  return hasWorker(bsda) ? "WORK" : "EMISSION";
};

function transporterSignature(
  transporter: ZodBsdaTransporter
): AllBsdaSignatureType {
  if (transporter.number && transporter.number > 1) {
    return `TRANSPORT_${transporter.number}` as AllBsdaSignatureType;
  }
  return "TRANSPORT";
}

/**
 * DOCUMENTATION AUTOMATIQUE
 * voir CONTRIBUTING -> Mettre à jour la documentation
 * pour plus de détails
 */
export const bsdaTransporterEditionRules: BsdaTransporterEditionRules = {
  id: {
    readableFieldName: "Le transporteur",
    sealed: { from: transporterSignature }
  },
  bsdaId: {
    readableFieldName: "Le BSDA associé au transporteur",
    sealed: { from: transporterSignature }
  },
  transporterCompanyName: {
    readableFieldName: "Le nom du transporteur",
    sealed: {
      from: transporterSignature
    },
    required: { from: transporterSignature }
  },
  transporterCompanySiret: {
    readableFieldName: "Le SIRET du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature,
      when: transporter => !transporter.transporterCompanyVatNumber
    }
  },
  transporterCompanyAddress: {
    readableFieldName: "L'adresse du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature
    }
  },
  transporterCompanyContact: {
    readableFieldName: "Le nom de contact du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature
    }
  },
  transporterCompanyPhone: {
    readableFieldName: "Le téléphone du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature
    }
  },
  transporterCompanyMail: {
    readableFieldName: "L'email du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature
    }
  },
  transporterCompanyVatNumber: {
    readableFieldName: "Le numéro de TVA du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature,
      when: transporter => !transporter.transporterCompanySiret
    }
  },
  transporterCustomInfo: {
    readableFieldName:
      "Les champs d'informations complémentaires du transporteur",
    sealed: { from: transporterSignature }
  },
  transporterRecepisseIsExempted: {
    readableFieldName: "L'exemption de récépissé du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature
    }
  },
  transporterRecepisseNumber: {
    readableFieldName: "Le numéro de récépissé du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature,
      when: requireTransporterRecepisse,
      customErrorMessage:
        "L'établissement doit renseigner son récépissé dans Trackdéchets."
    }
  },
  transporterRecepisseDepartment: {
    readableFieldName: "Le département de récépissé du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature,
      when: requireTransporterRecepisse,
      customErrorMessage:
        "L'établissement doit renseigner son récépissé dans Trackdéchets."
    }
  },
  transporterRecepisseValidityLimit: {
    readableFieldName: "La date de validité du récépissé du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature,
      when: requireTransporterRecepisse,
      customErrorMessage:
        "L'établissement doit renseigner son récépissé dans Trackdéchets."
    }
  },
  transporterTransportMode: {
    readableFieldName: "Le mode de transport",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature
    }
  },
  transporterTransportPlates: {
    readableFieldName: "L'immatriculation du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature,
      when: bsda => bsda.transporterTransportMode === "ROAD"
    }
  },
  transporterTransportTakenOverAt: {
    readableFieldName: "La date d'enlèvement du transporteur",
    sealed: { from: transporterSignature }
  }
};

export const bsdaEditionRules: BsdaEditionRules = {
  type: {
    readableFieldName: "Le type de bordereau",
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" }
  },
  emitterIsPrivateIndividual: {
    readableFieldName: "Le fait que le détenteur soit un particulier",
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" }
  },
  emitterCompanyName: {
    readableFieldName: "Le nom de l'entreprise émettrice",
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" }
  },
  emitterCompanySiret: {
    readableFieldName: "Le SIRET de l'entreprise émettrice",
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION",
      // l'émetteur n'est pas un particulier
      when: bsda => !bsda.emitterIsPrivateIndividual
    }
  },
  emitterCompanyAddress: {
    readableFieldName: "L'adresse de l'entreprise émettrice",
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" }
  },
  emitterCompanyContact: {
    readableFieldName: "Le nom de contact de l'entreprise émettrice",
    sealed: {
      // EMISSION ou TRANSPORT si émetteur
      from: sealedFromEmissionExceptForEmitter
    },
    required: {
      from: "EMISSION",
      // l'émetteur n'est pas un particulier
      when: bsda => !bsda.emitterIsPrivateIndividual
    }
  },
  emitterCompanyPhone: {
    readableFieldName: "Le téléphone de l'entreprise émettrice",
    sealed: {
      from: sealedFromEmissionExceptForEmitter
    },
    required: {
      from: "EMISSION",
      // l'émetteur n'est pas un particulier
      when: bsda => !bsda.emitterIsPrivateIndividual
    }
  },
  emitterCompanyMail: {
    readableFieldName: "L'email de l'entreprise émettrice",
    sealed: {
      from: sealedFromEmissionExceptForEmitter
    },
    required: {
      from: "EMISSION",
      // l'émetteur n'est pas un particulier
      when: bsda => !bsda.emitterIsPrivateIndividual
    }
  },
  emitterCustomInfo: {
    readableFieldName:
      "Les champs d'informations complémentaires de l'entreprise émettrice",
    sealed: {
      from: sealedFromEmissionExceptForEmitter
    }
  },
  emitterPickupSiteName: {
    readableFieldName: "Le nom de l'adresse de chantier ou de collecte",
    sealed: {
      from: sealedFromEmissionExceptForEmitter
    }
  },
  emitterPickupSiteAddress: {
    readableFieldName: "L'adresse de collecte ou de chantier",
    sealed: {
      from: sealedFromEmissionExceptForEmitter
    }
  },
  emitterPickupSiteCity: {
    readableFieldName: "La ville de l'adresse de collecte ou de chantier",
    sealed: {
      from: sealedFromEmissionExceptForEmitter
    }
  },
  emitterPickupSitePostalCode: {
    readableFieldName: "Le code postal de l'adresse de collecte ou de chantier",
    sealed: {
      from: sealedFromEmissionExceptForEmitter
    }
  },
  emitterPickupSiteInfos: {
    readableFieldName: "Les informations de l'adresse de collecte",
    sealed: {
      from: sealedFromEmissionExceptForEmitter
    }
  },
  ecoOrganismeName: {
    readableFieldName: "Le nom de l'éco-organisme",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      // il y a un SIRET d'éco-organisme
      when: bsda => !!bsda.ecoOrganismeSiret
    }
  },
  ecoOrganismeSiret: {
    readableFieldName: "Le SIRET de l'éco-organisme",
    sealed: { from: "TRANSPORT" }
  },
  destinationCompanyName: {
    readableFieldName: "Le nom de l'entreprise de destination",
    sealed: {
      // EMISSION ou WORK si émetteur ou TRANSPORT lors de l'ajout/suppression d'entreposage provisoire
      from: sealedFromEmissionExceptAddOrRemoveNextDestination
    },
    required: { from: "EMISSION" }
  },
  destinationCompanySiret: {
    readableFieldName: "Le SIRET de l'entreprise de destination",
    sealed: {
      from: sealedFromEmissionExceptAddOrRemoveNextDestination
    },
    required: { from: "EMISSION" }
  },
  destinationCompanyAddress: {
    readableFieldName: "L'adresse de l'entreprise de destination",
    sealed: {
      from: sealedFromEmissionExceptAddOrRemoveNextDestination
    },
    required: { from: "EMISSION" }
  },
  destinationCompanyContact: {
    readableFieldName: "Le nom de contact de l'entreprise de destination",
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION" }
  },
  destinationCompanyPhone: {
    readableFieldName: "Le téléphone de l'entreprise de destination",
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION" }
  },
  destinationCompanyMail: {
    readableFieldName: "L'email de l'entreprise de destination",
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION" }
  },
  destinationCustomInfo: {
    readableFieldName:
      "Les champs d'informations complémentaires de l'entreprise de destination",
    sealed: { from: "OPERATION" }
  },
  destinationCap: {
    readableFieldName: "Le CAP du destinataire",
    sealed: { from: "OPERATION" },
    required: {
      from: "EMISSION",
      // le BSDA n'est pas une collection 2710 et il n'y a pas d'entreposage provisoire
      when: bsda =>
        bsda.type !== BsdaType.COLLECTION_2710 &&
        !Boolean(bsda.destinationOperationNextDestinationCompanySiret)
    }
  },
  destinationPlannedOperationCode: {
    readableFieldName: "Le code d'opération prévu",
    sealed: { from: sealedFromEmissionExceptAddOrRemoveNextDestination },
    required: { from: "EMISSION" }
  },
  destinationReceptionDate: {
    readableFieldName: "La date de réception",
    required: { from: "RECEPTION", when: isReceptionSignatureStep },
    sealed: { from: "RECEPTION", when: isReceptionDataSealed }
  },
  destinationReceptionWeight: {
    readableFieldName: "Le poids du déchet",
    sealed: { from: "RECEPTION", when: isReceptionDataSealed },
    required: { from: "RECEPTION" }
  },
  destinationReceptionRefusedWeight: {
    readableFieldName: "Le poids refusé",
    sealed: { from: "RECEPTION", when: isReceptionDataSealed }
  },
  destinationReceptionAcceptationStatus: {
    sealed: { from: "RECEPTION", when: isReceptionDataSealed },
    required: { from: "RECEPTION" },
    readableFieldName: "L'acceptation du déchet"
  },
  destinationReceptionRefusalReason: {
    readableFieldName: "La raison du refus du déchet",
    sealed: { from: "RECEPTION", when: isReceptionDataSealed },
    required: {
      from: "RECEPTION",
      // le déchet est refusé ou partiellement refusé
      when: isRefusedOrPartiallyRefused
    }
  },
  destinationOperationCode: {
    readableFieldName: "Le code d'opération réalisé",
    sealed: { from: "OPERATION" },
    required: {
      from: "OPERATION",
      // le déchet n'est pas refusé
      when: isNotRefused
    }
  },
  destinationOperationMode: {
    readableFieldName: "Le mode de traitement",
    sealed: { from: "OPERATION" },
    required: {
      from: "OPERATION",
      // il y a un code d'opération final renseigné
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
    readableFieldName: "La description de l'opération réalisée",
    sealed: { from: "OPERATION" }
  },
  destinationOperationDate: {
    readableFieldName: "La date de l'opération",
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION", when: isNotRefused }
  },
  destinationOperationNextDestinationCompanyName: {
    readableFieldName: "Le nom de l'exutoire",
    sealed: { from: "OPERATION" }
  },
  destinationOperationNextDestinationCompanySiret: {
    readableFieldName: "Le SIRET de l'exutoire",
    sealed: { from: "OPERATION" }
  },
  destinationOperationNextDestinationCompanyVatNumber: {
    readableFieldName: "Le numéro de TVA de l'exutoire",
    sealed: { from: "OPERATION" }
  },
  destinationOperationNextDestinationCompanyAddress: {
    readableFieldName: "L'adresse de l'exutoire",
    sealed: { from: "OPERATION" },
    required: {
      from: "EMISSION",
      // il y a un SIRET d'exutoire
      when: bsda =>
        Boolean(bsda.destinationOperationNextDestinationCompanySiret)
    }
  },
  destinationOperationNextDestinationCompanyContact: {
    readableFieldName: "Le nom de contact de l'exutoire",
    sealed: { from: "OPERATION" },
    required: {
      from: "EMISSION",
      // il y a un SIRET d'exutoire
      when: bsda =>
        Boolean(bsda.destinationOperationNextDestinationCompanySiret)
    }
  },
  destinationOperationNextDestinationCompanyPhone: {
    readableFieldName: "Le téléphone de l'exutoire",
    sealed: { from: "OPERATION" },
    required: {
      from: "EMISSION",
      // il y a un SIRET d'exutoire
      when: bsda =>
        Boolean(bsda.destinationOperationNextDestinationCompanySiret)
    }
  },
  destinationOperationNextDestinationCompanyMail: {
    readableFieldName: "L'email de l'exutoire",
    sealed: { from: "OPERATION" },
    required: {
      from: "EMISSION",
      // il y a un SIRET d'exutoire
      when: bsda =>
        Boolean(bsda.destinationOperationNextDestinationCompanySiret)
    }
  },
  destinationOperationNextDestinationCap: {
    readableFieldName: "Le CAP de l'exutoire",
    sealed: { from: "OPERATION" },
    required: {
      from: "EMISSION",
      // il y a un SIRET d'exutoire
      when: bsda =>
        Boolean(bsda.destinationOperationNextDestinationCompanySiret)
    }
  },
  destinationOperationNextDestinationPlannedOperationCode: {
    readableFieldName: "Le code d'opération de l'exutoire",
    sealed: { from: "OPERATION" },
    required: {
      from: "EMISSION",
      // il y a un SIRET d'exutoire
      when: bsda =>
        Boolean(bsda.destinationOperationNextDestinationCompanySiret)
    }
  },
  transporters: {
    readableFieldName: "La liste des transporteurs",
    sealed: {
      from: "TRANSPORT_5"
    },
    required: {
      // jamais si c'est une collection 2710, EMISSION si l'émetteur est un particulier et il n'y a pas d'entreprise de travaux, TRANSPORT sinon
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
    readableFieldName: "La présence d'une entreprise de travaux",
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: {
      from: "EMISSION",
      // il s'agit d'une collecte sur un chantier et workerIsDisabled est à true
      when: hasWorker
    }
  },
  workerCompanyName: {
    readableFieldName: "Le nom de l'entreprise de travaux",
    sealed: {
      from: sealedFromEmissionExceptForEmitter
    },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerCompanySiret: {
    readableFieldName: "Le SIRET de l'entreprise de travaux",
    sealed: {
      from: sealedFromEmissionExceptForEmitter
    },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerCompanyAddress: {
    readableFieldName: "L'adresse de l'entreprise de travaux",
    sealed: {
      from: sealedFromEmissionExceptForEmitter
    },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerCompanyContact: {
    readableFieldName: "Le nom de contact de l'entreprise de travaux",
    sealed: { from: "WORK" },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerCompanyPhone: {
    readableFieldName: "Le téléphone de l'entreprise de travaux",
    sealed: { from: "WORK" },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerCompanyMail: {
    readableFieldName: "L'email de l'entreprise de travaux",
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
    readableFieldName: "Travaux relevant de la sous-section 4",
    sealed: { from: "WORK" }
  },
  workerCertificationHasSubSectionThree: {
    readableFieldName: "Travaux relevant de la sous-section 3",
    sealed: { from: "WORK" }
  },
  workerCertificationCertificationNumber: {
    readableFieldName: "Le numéro de certification de l'entreprise de travaux",
    sealed: { from: "WORK" },
    required: {
      from: "WORK",
      // il s'agit de travaux relevant de la sous-section 3
      when: bsda => Boolean(bsda.workerCertificationHasSubSectionThree)
    }
  },
  workerCertificationValidityLimit: {
    readableFieldName:
      "La date de validité de la certification de l'entreprise de travaux",
    sealed: { from: "WORK" },
    required: {
      from: "WORK",
      // il s'agit de travaux relevant de la sous-section 3
      when: bsda => Boolean(bsda.workerCertificationHasSubSectionThree)
    }
  },
  workerCertificationOrganisation: {
    readableFieldName:
      "L'organisme de la certification de l'entreprise de travaux",
    sealed: { from: "WORK" },
    required: {
      from: "WORK",
      // il s'agit de travaux relevant de la sous-section 3
      when: bsda => Boolean(bsda.workerCertificationHasSubSectionThree)
    }
  },
  brokerCompanyName: {
    readableFieldName: "Le nom du courtier",
    sealed: { from: "OPERATION" }
  },
  brokerCompanySiret: {
    readableFieldName: "Le SIRET du courtier",
    sealed: { from: "OPERATION" }
  },
  brokerCompanyAddress: {
    readableFieldName: "L'adresse du courtier",
    sealed: { from: "OPERATION" }
  },
  brokerCompanyContact: {
    readableFieldName: "Le nom de contact du courtier",
    sealed: { from: "OPERATION" }
  },
  brokerCompanyPhone: {
    readableFieldName: "Le téléphone du courtier",
    sealed: { from: "OPERATION" }
  },
  brokerCompanyMail: {
    readableFieldName: "Le mail du courtier",
    sealed: { from: "OPERATION" }
  },
  brokerRecepisseNumber: {
    readableFieldName: "Le numéro de récépissé du courtier",
    sealed: { from: "OPERATION" },
    required: {
      from: "EMISSION",
      // un courtier est désigné sur le bordereau
      when: requireBrokerRecepisse
    }
  },
  brokerRecepisseDepartment: {
    readableFieldName: "Le département du récépissé du courtier",
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION", when: requireBrokerRecepisse }
  },
  brokerRecepisseValidityLimit: {
    readableFieldName: "La date de validité du récépissé du courtier",
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION", when: requireBrokerRecepisse }
  },
  wasteCode: {
    sealed: {
      from: sealedFromEmissionExceptForEmitter
    },
    required: { from: "EMISSION" },
    readableFieldName: "Le code déchet"
  },
  wasteIsSubjectToADR: {
    readableFieldName: "Si le déchet est soumis à l'ADR ou non",
    sealed: { from: "WORK" }
  },
  wasteAdr: { readableFieldName: "La mention ADR", sealed: { from: "WORK" } },
  wasteNonRoadRegulationMention: {
    readableFieldName: "La mention RID, ADN, IMDG",
    sealed: { from: "WORK" }
  },
  wasteFamilyCode: {
    sealed: {
      // EMISSION ou WORK si il y a une entreprise de travaux
      from: fromWorkOrEmissionWhenThereIsNoWorker
    },
    required: { from: fromWorkOrEmissionWhenThereIsNoWorker },
    readableFieldName: "Le code famille"
  },
  wasteMaterialName: {
    readableFieldName: "Le nom de matériau",
    sealed: { from: fromWorkOrEmissionWhenThereIsNoWorker },
    required: { from: fromWorkOrEmissionWhenThereIsNoWorker }
  },
  wasteConsistence: {
    sealed: { from: fromWorkOrEmissionWhenThereIsNoWorker },
    required: { from: fromWorkOrEmissionWhenThereIsNoWorker },
    readableFieldName: "La consistance"
  },
  wasteConsistenceDescription: {
    sealed: { from: fromWorkOrEmissionWhenThereIsNoWorker },
    required: { from: fromWorkOrEmissionWhenThereIsNoWorker },
    readableFieldName: "La consistance"
  },
  wasteSealNumbers: {
    readableFieldName: "Le(s) numéro(s) de scellés",
    sealed: { from: "WORK" }
  },
  wastePop: {
    readableFieldName: "Le champ sur les polluants organiques persistants",
    sealed: { from: fromWorkOrEmissionWhenThereIsNoWorker },
    required: { from: fromWorkOrEmissionWhenThereIsNoWorker }
  },
  packagings: {
    sealed: { from: fromWorkOrEmissionWhenThereIsNoWorker },
    required: {
      from: fromWorkOrEmissionWhenThereIsNoWorker
    },
    readableFieldName: "Le conditionnement"
  },
  weightIsEstimate: {
    readableFieldName: "Le champ pour indiquer si le poids est estimé",
    sealed: { from: fromWorkOrEmissionWhenThereIsNoWorker },
    required: { from: fromWorkOrEmissionWhenThereIsNoWorker }
  },
  weightValue: {
    readableFieldName: "Le poids",
    sealed: { from: fromWorkOrEmissionWhenThereIsNoWorker },
    required: { from: fromWorkOrEmissionWhenThereIsNoWorker }
  },
  grouping: { sealed: { from: "EMISSION" } },
  forwarding: { sealed: { from: "EMISSION" } },
  intermediaries: {
    readableFieldName: "Les intermédiaires",
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

function requireBrokerRecepisse(bsda: ZodBsda) {
  return (
    !!bsda.brokerCompanySiret &&
    !!bsda.createdAt &&
    bsda.createdAt.getTime() > v20250201.getTime()
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

function isReceptionSignatureStep(_, currentSignatureType: BsdaSignatureType) {
  return currentSignatureType === "RECEPTION";
}

function isReceptionDataSealed(bsda: ZodBsda) {
  return (
    Boolean(bsda.destinationReceptionSignatureDate) ||
    Boolean(bsda.destinationOperationSignatureDate)
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

  const currentSignatureType = getCurrentSignatureType(persisted);

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
          `${fieldDescription} a été verrouillé via signature et ne peut pas être modifié.`,
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
              `${fieldDescription} n°1 a été verrouillé via signature et ne peut pas être modifié.`
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
  const currentSignatureType = getCurrentSignatureType(bsda);
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
  context?: RuleContext<T>,
  currentSignatureType?: AllBsdaSignatureType | undefined
) {
  const from =
    typeof rule.from === "function" ? rule.from(resource, context) : rule.from;

  const isApplied =
    from &&
    signatures.includes(from) &&
    (rule.when === undefined || rule.when(resource, currentSignatureType));

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
  signatures: AllBsdaSignatureType[],
  currentSignatureType: AllBsdaSignatureType | undefined
) {
  return isRuleApplied(rule, bsda, signatures, undefined, currentSignatureType);
}

export function isBsdaTransporterFieldRequired(
  rule: EditionRule<ZodBsdaTransporter>,
  bsdaTransporter: ZodBsdaTransporter,
  signatures: AllBsdaSignatureType[]
) {
  return isRuleApplied(rule, bsdaTransporter, signatures);
}
