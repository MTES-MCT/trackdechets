import {
  BsdaType,
  TransportMode,
  User,
  WasteAcceptationStatus
} from "@td/prisma";
import { ParsedZodBsda, ZodBsda, ZodBsdaTransporter } from "./schema";
import { getOperationModes, isForeignVat } from "@td/constants";
import {
  getCurrentSignatureType,
  getSignatureAncestors,
  getUpdatedFields,
  getBsdaUserFunctions,
  BsdaUserFunctions
} from "./helpers";
import { capitalize } from "../../common/strings";
import { SealedFieldError } from "../../common/errors";
import { BsdaValidationContext } from "./types";
import { AllBsdaSignatureType } from "../types";
import { v20250201, v20251101 } from "../../common/validation";
import {
  BsdaInput,
  BsdaSignatureType,
  BsdaTransporterInput
} from "@td/codegen-back";
import { Leaves } from "../../types";

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

export type EditionRulePath = Leaves<
  BsdaInput & {
    transporters: {
      1: BsdaTransporterInput;
      2: BsdaTransporterInput;
      3: BsdaTransporterInput;
      4: BsdaTransporterInput;
      5: BsdaTransporterInput;
    };
  },
  5
>;

export type TransporterEditionRulePath = Leaves<BsdaTransporterInput, 5>;

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
    // a path to return in the errors to help the front display the error in context
    path?: T extends ZodBsda ? EditionRulePath : TransporterEditionRulePath;
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
    required: { from: transporterSignature },
    path: ["company", "name"]
  },
  transporterCompanySiret: {
    readableFieldName: "Le SIRET du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature,
      when: transporter => !transporter.transporterCompanyVatNumber
    },
    path: ["company", "siret"]
  },
  transporterCompanyAddress: {
    readableFieldName: "L'adresse du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature
    },
    path: ["company", "address"]
  },
  transporterCompanyContact: {
    readableFieldName: "Le nom de contact du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature
    },
    path: ["company", "contact"]
  },
  transporterCompanyPhone: {
    readableFieldName: "Le téléphone du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature
    },
    path: ["company", "phone"]
  },
  transporterCompanyMail: {
    readableFieldName: "L'email du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature
    },
    path: ["company", "mail"]
  },
  transporterCompanyVatNumber: {
    readableFieldName: "Le numéro de TVA du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature,
      when: transporter => !transporter.transporterCompanySiret
    },
    path: ["company", "vatNumber"]
  },
  transporterCustomInfo: {
    readableFieldName:
      "Les champs d'informations complémentaires du transporteur",
    sealed: { from: transporterSignature },
    path: ["customInfo"]
  },
  transporterRecepisseIsExempted: {
    readableFieldName: "L'exemption de récépissé du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature
    },
    path: ["recepisse", "isExempted"]
  },
  transporterRecepisseNumber: {
    readableFieldName: "Le numéro de récépissé du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature,
      when: requireTransporterRecepisse,
      customErrorMessage:
        "L'établissement doit renseigner son récépissé dans Trackdéchets."
    },
    path: ["recepisse", "number"]
  },
  transporterRecepisseDepartment: {
    readableFieldName: "Le département de récépissé du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature,
      when: requireTransporterRecepisse,
      customErrorMessage:
        "L'établissement doit renseigner son récépissé dans Trackdéchets."
    },
    path: ["recepisse", "department"]
  },
  transporterRecepisseValidityLimit: {
    readableFieldName: "La date de validité du récépissé du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature,
      when: requireTransporterRecepisse,
      customErrorMessage:
        "L'établissement doit renseigner son récépissé dans Trackdéchets."
    },
    path: ["recepisse", "validityLimit"]
  },
  transporterTransportMode: {
    readableFieldName: "Le mode de transport",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature
    },
    path: ["transport", "mode"]
  },
  transporterTransportPlates: {
    readableFieldName: "L'immatriculation du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature,
      when: bsda => bsda.transporterTransportMode === "ROAD"
    },
    path: ["transport", "plates"]
  },
  transporterTransportTakenOverAt: {
    readableFieldName: "La date d'enlèvement du transporteur",
    sealed: { from: transporterSignature },
    path: ["transport", "takenOverAt"]
  }
};

export const bsdaEditionRules: BsdaEditionRules = {
  type: {
    readableFieldName: "Le type de bordereau",
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" },
    path: ["type"]
  },
  emitterIsPrivateIndividual: {
    readableFieldName: "Le fait que le détenteur soit un particulier",
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" },
    path: ["emitter", "isPrivateIndividual"]
  },
  emitterCompanyName: {
    readableFieldName: "Le nom de l'entreprise émettrice",
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" },
    path: ["emitter", "company", "name"]
  },
  emitterCompanySiret: {
    readableFieldName: "Le SIRET de l'entreprise émettrice",
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION",
      // l'émetteur n'est pas un particulier
      when: bsda => !bsda.emitterIsPrivateIndividual
    },
    path: ["emitter", "company", "siret"]
  },
  emitterCompanyAddress: {
    readableFieldName: "L'adresse de l'entreprise émettrice",
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" },
    path: ["emitter", "company", "address"]
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
    },
    path: ["emitter", "company", "contact"]
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
    },
    path: ["emitter", "company", "phone"]
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
    },
    path: ["emitter", "company", "mail"]
  },
  emitterCustomInfo: {
    readableFieldName:
      "Les champs d'informations complémentaires de l'entreprise émettrice",
    sealed: {
      from: sealedFromEmissionExceptForEmitter
    },
    path: ["emitter", "customInfo"]
  },
  emitterPickupSiteName: {
    readableFieldName: "Le nom de l'adresse de chantier ou de collecte",
    sealed: {
      from: sealedFromEmissionExceptForEmitter
    },
    path: ["emitter", "pickupSite", "name"]
  },
  emitterPickupSiteAddress: {
    readableFieldName: "L'adresse de collecte ou de chantier",
    sealed: {
      from: sealedFromEmissionExceptForEmitter
    },
    path: ["emitter", "pickupSite", "address"]
  },
  emitterPickupSiteCity: {
    readableFieldName: "La ville de l'adresse de collecte ou de chantier",
    sealed: {
      from: sealedFromEmissionExceptForEmitter
    },
    path: ["emitter", "pickupSite", "city"]
  },
  emitterPickupSitePostalCode: {
    readableFieldName: "Le code postal de l'adresse de collecte ou de chantier",
    sealed: {
      from: sealedFromEmissionExceptForEmitter
    },
    path: ["emitter", "pickupSite", "postalCode"]
  },
  emitterPickupSiteInfos: {
    readableFieldName: "Les informations de l'adresse de collecte",
    sealed: {
      from: sealedFromEmissionExceptForEmitter
    },
    path: ["emitter", "pickupSite", "infos"]
  },
  ecoOrganismeName: {
    readableFieldName: "Le nom de l'éco-organisme",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      // il y a un SIRET d'éco-organisme
      when: bsda => !!bsda.ecoOrganismeSiret
    },
    path: ["ecoOrganisme", "name"]
  },
  ecoOrganismeSiret: {
    readableFieldName: "Le SIRET de l'éco-organisme",
    sealed: { from: "TRANSPORT" },
    path: ["ecoOrganisme", "siret"]
  },
  destinationCompanyName: {
    readableFieldName: "Le nom de l'entreprise de destination",
    sealed: {
      // EMISSION ou WORK si émetteur ou TRANSPORT lors de l'ajout/suppression d'entreposage provisoire
      from: sealedFromEmissionExceptAddOrRemoveNextDestination
    },
    required: { from: "EMISSION" },
    path: ["destination", "company", "name"]
  },
  destinationCompanySiret: {
    readableFieldName: "Le SIRET de l'entreprise de destination",
    sealed: {
      from: sealedFromEmissionExceptAddOrRemoveNextDestination
    },
    required: { from: "EMISSION" },
    path: ["destination", "company", "siret"]
  },
  destinationCompanyAddress: {
    readableFieldName: "L'adresse de l'entreprise de destination",
    sealed: {
      from: sealedFromEmissionExceptAddOrRemoveNextDestination
    },
    required: { from: "EMISSION" },
    path: ["destination", "company", "address"]
  },
  destinationCompanyContact: {
    readableFieldName: "Le nom de contact de l'entreprise de destination",
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION" },
    path: ["destination", "company", "contact"]
  },
  destinationCompanyPhone: {
    readableFieldName: "Le téléphone de l'entreprise de destination",
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION" },
    path: ["destination", "company", "phone"]
  },
  destinationCompanyMail: {
    readableFieldName: "L'email de l'entreprise de destination",
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION" },
    path: ["destination", "company", "mail"]
  },
  destinationCustomInfo: {
    readableFieldName:
      "Les champs d'informations complémentaires de l'entreprise de destination",
    sealed: { from: "OPERATION" },
    path: ["destination", "customInfo"]
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
    },
    path: ["destination", "cap"]
  },
  destinationPlannedOperationCode: {
    readableFieldName: "Le code d'opération prévu",
    sealed: { from: sealedFromEmissionExceptAddOrRemoveNextDestination },
    required: { from: "EMISSION" },
    path: ["destination", "plannedOperationCode"]
  },
  destinationReceptionDate: {
    readableFieldName: "La date de réception",
    required: { from: "RECEPTION", when: isReceptionSignatureStep },
    sealed: { from: "RECEPTION", when: isReceptionDataSealed },
    path: ["destination", "reception", "date"]
  },
  destinationReceptionWeight: {
    readableFieldName: "Le poids du déchet",
    sealed: { from: "RECEPTION", when: isReceptionDataSealed },
    required: { from: "RECEPTION" },
    path: ["destination", "reception", "weight"]
  },
  destinationReceptionWeightIsEstimate: {
    readableFieldName: "Le caractère estimatif du poids du déchet",
    sealed: { from: "RECEPTION", when: isReceptionDataSealed }
  },
  destinationReceptionRefusedWeight: {
    readableFieldName: "Le poids refusé",
    sealed: { from: "RECEPTION", when: isReceptionDataSealed },
    path: ["destination", "reception", "refusedWeight"]
  },
  destinationReceptionAcceptationStatus: {
    sealed: { from: "RECEPTION", when: isReceptionDataSealed },
    required: { from: "RECEPTION" },
    readableFieldName: "L'acceptation du déchet",
    path: ["destination", "reception", "acceptationStatus"]
  },
  destinationReceptionRefusalReason: {
    readableFieldName: "La raison du refus du déchet",
    sealed: { from: "RECEPTION", when: isReceptionDataSealed },
    required: {
      from: "RECEPTION",
      // le déchet est refusé ou partiellement refusé
      when: isRefusedOrPartiallyRefused
    },
    path: ["destination", "reception", "refusalReason"]
  },
  destinationOperationCode: {
    readableFieldName: "Le code d'opération réalisé",
    sealed: { from: "OPERATION" },
    required: {
      from: "OPERATION",
      // le déchet n'est pas refusé
      when: isNotRefused
    },
    path: ["destination", "operation", "code"]
  },
  destinationOperationMode: {
    readableFieldName: "Le mode de traitement",
    sealed: { from: "OPERATION" },
    required: {
      from: "OPERATION",
      // il y a un code d'opération final renseigné
      when: bsda => {
        if (bsda.destinationOperationCode) {
          const modes = getOperationModes(bsda.destinationOperationCode);
          if (modes.length && !bsda.destinationOperationMode) {
            return true;
          }
        }
        return false;
      }
    },
    path: ["destination", "operation", "mode"]
  },
  destinationOperationDescription: {
    readableFieldName: "La description de l'opération réalisée",
    sealed: { from: "OPERATION" },
    path: ["destination", "operation", "description"]
  },
  destinationOperationDate: {
    readableFieldName: "La date de l'opération",
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION", when: isNotRefused },
    path: ["destination", "operation", "date"]
  },
  destinationOperationNextDestinationCompanyName: {
    readableFieldName: "Le nom de l'exutoire",
    sealed: { from: "OPERATION" },
    path: ["destination", "operation", "nextDestination", "company", "name"]
  },
  destinationOperationNextDestinationCompanySiret: {
    readableFieldName: "Le SIRET de l'exutoire",
    sealed: { from: "OPERATION" },
    path: ["destination", "operation", "nextDestination", "company", "siret"]
  },
  destinationOperationNextDestinationCompanyVatNumber: {
    readableFieldName: "Le numéro de TVA de l'exutoire",
    sealed: { from: "OPERATION" },
    path: [
      "destination",
      "operation",
      "nextDestination",
      "company",
      "vatNumber"
    ]
  },
  destinationOperationNextDestinationCompanyAddress: {
    readableFieldName: "L'adresse de l'exutoire",
    sealed: { from: "OPERATION" },
    required: {
      from: "EMISSION",
      // il y a un SIRET d'exutoire
      when: bsda =>
        Boolean(bsda.destinationOperationNextDestinationCompanySiret)
    },
    path: ["destination", "operation", "nextDestination", "company", "address"]
  },
  destinationOperationNextDestinationCompanyContact: {
    readableFieldName: "Le nom de contact de l'exutoire",
    sealed: { from: "OPERATION" },
    required: {
      from: "EMISSION",
      // il y a un SIRET d'exutoire
      when: bsda =>
        Boolean(bsda.destinationOperationNextDestinationCompanySiret)
    },
    path: ["destination", "operation", "nextDestination", "company", "contact"]
  },
  destinationOperationNextDestinationCompanyPhone: {
    readableFieldName: "Le téléphone de l'exutoire",
    sealed: { from: "OPERATION" },
    required: {
      from: "EMISSION",
      // il y a un SIRET d'exutoire
      when: bsda =>
        Boolean(bsda.destinationOperationNextDestinationCompanySiret)
    },
    path: ["destination", "operation", "nextDestination", "company", "phone"]
  },
  destinationOperationNextDestinationCompanyMail: {
    readableFieldName: "L'email de l'exutoire",
    sealed: { from: "OPERATION" },
    required: {
      from: "EMISSION",
      // il y a un SIRET d'exutoire
      when: bsda =>
        Boolean(bsda.destinationOperationNextDestinationCompanySiret)
    },
    path: ["destination", "operation", "nextDestination", "company", "mail"]
  },
  destinationOperationNextDestinationCap: {
    readableFieldName: "Le CAP de l'exutoire",
    sealed: { from: "OPERATION" },
    required: {
      from: "EMISSION",
      // il y a un SIRET d'exutoire
      when: bsda =>
        Boolean(bsda.destinationOperationNextDestinationCompanySiret)
    },
    path: ["destination", "operation", "nextDestination", "cap"]
  },
  destinationOperationNextDestinationPlannedOperationCode: {
    readableFieldName: "Le code d'opération de l'exutoire",
    sealed: { from: "OPERATION" },
    required: {
      from: "EMISSION",
      // il y a un SIRET d'exutoire
      when: bsda =>
        Boolean(bsda.destinationOperationNextDestinationCompanySiret)
    },
    path: [
      "destination",
      "operation",
      "nextDestination",
      "plannedOperationCode"
    ]
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
    },
    path: ["transporters"]
  },
  workerIsDisabled: {
    readableFieldName: "La présence d'une entreprise de travaux",
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: {
      from: "EMISSION",
      // il s'agit d'une collecte sur un chantier et workerIsDisabled est à true
      when: hasWorker
    },
    path: ["worker", "isDisabled"]
  },
  workerCompanyName: {
    readableFieldName: "Le nom de l'entreprise de travaux",
    sealed: {
      from: sealedFromEmissionExceptForEmitter
    },
    required: {
      from: "EMISSION",
      when: hasWorker
    },
    path: ["worker", "company", "name"]
  },
  workerCompanySiret: {
    readableFieldName: "Le SIRET de l'entreprise de travaux",
    sealed: {
      from: sealedFromEmissionExceptForEmitter
    },
    required: {
      from: "EMISSION",
      when: hasWorker
    },
    path: ["worker", "company", "siret"]
  },
  workerCompanyAddress: {
    readableFieldName: "L'adresse de l'entreprise de travaux",
    sealed: {
      from: sealedFromEmissionExceptForEmitter
    },
    required: {
      from: "EMISSION",
      when: hasWorker
    },
    path: ["worker", "company", "address"]
  },
  workerCompanyContact: {
    readableFieldName: "Le nom de contact de l'entreprise de travaux",
    sealed: { from: "WORK" },
    required: {
      from: "EMISSION",
      when: hasWorker
    },
    path: ["worker", "company", "contact"]
  },
  workerCompanyPhone: {
    readableFieldName: "Le téléphone de l'entreprise de travaux",
    sealed: { from: "WORK" },
    required: {
      from: "EMISSION",
      when: hasWorker
    },
    path: ["worker", "company", "phone"]
  },
  workerCompanyMail: {
    readableFieldName: "L'email de l'entreprise de travaux",
    sealed: { from: "WORK" },
    required: {
      from: "EMISSION",
      when: hasWorker
    },
    path: ["worker", "company", "mail"]
  },
  workerWorkHasEmitterPaperSignature: {
    sealed: { from: "WORK" },
    path: ["worker", "work", "hasEmitterPaperSignature"]
  },
  workerCertificationHasSubSectionFour: {
    readableFieldName: "Travaux relevant de la sous-section 4",
    sealed: { from: "WORK" },
    path: ["worker", "certification", "hasSubSectionFour"]
  },
  workerCertificationHasSubSectionThree: {
    readableFieldName: "Travaux relevant de la sous-section 3",
    sealed: { from: "WORK" },
    path: ["worker", "certification", "hasSubSectionThree"]
  },
  workerCertificationCertificationNumber: {
    readableFieldName: "Le numéro de certification de l'entreprise de travaux",
    sealed: { from: "WORK" },
    required: {
      from: "WORK",
      // il s'agit de travaux relevant de la sous-section 3
      when: bsda => Boolean(bsda.workerCertificationHasSubSectionThree)
    },
    path: ["worker", "certification", "certificationNumber"]
  },
  workerCertificationValidityLimit: {
    readableFieldName:
      "La date de validité de la certification de l'entreprise de travaux",
    sealed: { from: "WORK" },
    required: {
      from: "WORK",
      // il s'agit de travaux relevant de la sous-section 3
      when: bsda => Boolean(bsda.workerCertificationHasSubSectionThree)
    },
    path: ["worker", "certification", "validityLimit"]
  },
  workerCertificationOrganisation: {
    readableFieldName:
      "L'organisme de la certification de l'entreprise de travaux",
    sealed: { from: "WORK" },
    required: {
      from: "WORK",
      // il s'agit de travaux relevant de la sous-section 3
      when: bsda => Boolean(bsda.workerCertificationHasSubSectionThree)
    },
    path: ["worker", "certification", "organisation"]
  },
  brokerCompanyName: {
    readableFieldName: "Le nom du courtier",
    sealed: { from: "OPERATION" },
    path: ["broker", "company", "name"]
  },
  brokerCompanySiret: {
    readableFieldName: "Le SIRET du courtier",
    sealed: { from: "OPERATION" },
    path: ["broker", "company", "siret"]
  },
  brokerCompanyAddress: {
    readableFieldName: "L'adresse du courtier",
    sealed: { from: "OPERATION" },
    path: ["broker", "company", "address"]
  },
  brokerCompanyContact: {
    readableFieldName: "Le nom de contact du courtier",
    sealed: { from: "OPERATION" },
    path: ["broker", "company", "contact"]
  },
  brokerCompanyPhone: {
    readableFieldName: "Le téléphone du courtier",
    sealed: { from: "OPERATION" },
    path: ["broker", "company", "phone"]
  },
  brokerCompanyMail: {
    readableFieldName: "Le mail du courtier",
    sealed: { from: "OPERATION" },
    path: ["broker", "company", "mail"]
  },
  brokerRecepisseNumber: {
    readableFieldName: "Le numéro de récépissé du courtier",
    sealed: { from: "OPERATION" },
    required: {
      from: "EMISSION",
      // un courtier est désigné sur le bordereau
      when: requireBrokerRecepisse
    },
    path: ["broker", "recepisse", "number"]
  },
  brokerRecepisseDepartment: {
    readableFieldName: "Le département du récépissé du courtier",
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION", when: requireBrokerRecepisse },
    path: ["broker", "recepisse", "department"]
  },
  brokerRecepisseValidityLimit: {
    readableFieldName: "La date de validité du récépissé du courtier",
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION", when: requireBrokerRecepisse },
    path: ["broker", "recepisse", "validityLimit"]
  },
  wasteCode: {
    sealed: {
      from: sealedFromEmissionExceptForEmitter
    },
    required: { from: "EMISSION" },
    readableFieldName: "Le code déchet",
    path: ["waste", "code"]
  },
  wasteIsSubjectToADR: {
    readableFieldName: "Si le déchet est soumis à l'ADR ou non",
    sealed: { from: "WORK" },
    path: ["waste", "isSubjectToADR"]
  },
  wasteAdr: {
    readableFieldName: "La mention ADR",
    sealed: { from: "WORK" },
    path: ["waste", "adr"]
  },
  wasteNonRoadRegulationMention: {
    readableFieldName: "La mention RID, ADN, IMDG",
    sealed: { from: "WORK" },
    path: ["waste", "nonRoadRegulationMention"]
  },
  wasteFamilyCode: {
    sealed: {
      // EMISSION ou WORK si il y a une entreprise de travaux
      from: fromWorkOrEmissionWhenThereIsNoWorker
    },
    required: { from: fromWorkOrEmissionWhenThereIsNoWorker },
    readableFieldName: "Le code famille",
    path: ["waste", "familyCode"]
  },
  wasteMaterialName: {
    readableFieldName: "Le nom de matériau",
    sealed: { from: fromWorkOrEmissionWhenThereIsNoWorker },
    required: { from: fromWorkOrEmissionWhenThereIsNoWorker },
    path: ["waste", "materialName"]
  },
  wasteConsistence: {
    sealed: { from: fromWorkOrEmissionWhenThereIsNoWorker },
    required: { from: fromWorkOrEmissionWhenThereIsNoWorker },
    readableFieldName: "La consistance",
    path: ["waste", "consistence"]
  },
  wasteConsistenceDescription: {
    sealed: { from: fromWorkOrEmissionWhenThereIsNoWorker },
    required: {
      from: fromWorkOrEmissionWhenThereIsNoWorker,
      when: bsda =>
        bsda.wasteConsistence === "OTHER" &&
        !!bsda.createdAt &&
        bsda.createdAt.getTime() > v20251101.getTime()
    },
    readableFieldName: "La description de la consistance",
    path: ["waste", "consistenceDescription"]
  },
  wasteSealNumbers: {
    readableFieldName: "Le(s) numéro(s) de scellés",
    sealed: { from: "WORK" },
    path: ["waste", "sealNumbers"]
  },
  wastePop: {
    readableFieldName: "Le champ sur les polluants organiques persistants",
    sealed: { from: fromWorkOrEmissionWhenThereIsNoWorker },
    required: { from: fromWorkOrEmissionWhenThereIsNoWorker },
    path: ["waste", "pop"]
  },
  packagings: {
    sealed: { from: fromWorkOrEmissionWhenThereIsNoWorker },
    required: {
      from: fromWorkOrEmissionWhenThereIsNoWorker
    },
    readableFieldName: "Le conditionnement",
    path: ["packagings"]
  },
  weightIsEstimate: {
    readableFieldName: "Le champ pour indiquer si le poids est estimé",
    sealed: { from: fromWorkOrEmissionWhenThereIsNoWorker },
    required: { from: fromWorkOrEmissionWhenThereIsNoWorker },
    path: ["weight", "isEstimate"]
  },
  weightValue: {
    readableFieldName: "Le poids",
    sealed: { from: fromWorkOrEmissionWhenThereIsNoWorker },
    required: { from: fromWorkOrEmissionWhenThereIsNoWorker },
    path: ["weight", "value"]
  },
  grouping: { sealed: { from: "EMISSION" }, path: ["grouping"] },
  forwarding: { sealed: { from: "EMISSION" }, path: ["forwarding"] },
  intermediaries: {
    readableFieldName: "Les intermédiaires",
    sealed: { from: "TRANSPORT" },
    path: ["intermediaries"]
  }
};

export const getRequiredAndSealedFieldPaths = async (
  bsda: ZodBsda,
  currentSignatures: AllBsdaSignatureType[],
  user: User | undefined
): Promise<{
  sealed: EditionRulePath[];
}> => {
  const sealedFields: EditionRulePath[] = [];
  const userFunctions = await getBsdaUserFunctions(user, bsda);
  for (const bsdaField of Object.keys(bsdaEditionRules)) {
    const { sealed, path } =
      bsdaEditionRules[bsdaField as keyof BsdaEditableFields];
    if (path && sealed) {
      const isSealed = isBsdaFieldSealed(sealed, bsda, currentSignatures, {
        persisted: bsda,
        userFunctions
      });
      if (isSealed) {
        sealedFields.push(path);
      }
    }
  }
  const transporters = bsda.transporters ?? [];
  for (let i = 0; i < transporters.length; i++) {
    const bsdaTransporter = transporters[i];
    for (const bsdaTransporterField of Object.keys(
      bsdaTransporterEditionRules
    )) {
      const { sealed: bsdaTransporterSealed, path: bsdaTransporterPath } =
        bsdaTransporterEditionRules[
          bsdaTransporterField as keyof BsdaTransporterEditableFields
        ];
      if (bsdaTransporterSealed && bsdaTransporterPath) {
        const isSealed = isBsdaTransporterFieldSealed(
          bsdaTransporterSealed,
          bsdaTransporter,
          currentSignatures
        );
        if (isSealed) {
          if (i === 0) {
            // backward compatibility for single transporter UI
            sealedFields.push(
              ["transporter"].concat(bsdaTransporterPath) as EditionRulePath
            );
          }
          sealedFields.push(
            ["transporters", `${i + 1}`].concat(
              bsdaTransporterPath
            ) as EditionRulePath
          );
        }
      }
    }
  }

  return {
    sealed: sealedFields
  };
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
