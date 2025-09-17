import { ZodBsvhu } from "./schema";
import { BsvhuUserFunctions, BsvhuValidationContext } from "./types";
import type { BsvhuInput, SignatureTypeInput } from "@td/codegen-back";
import { User, WasteAcceptationStatus, TransportMode } from "@prisma/client";

import { isForeignVat } from "@td/constants";
import {
  getBsvhuUserFunctions,
  getCurrentSignatureType,
  getSignatureAncestors,
  getUpdatedFields
} from "./helpers";
import { capitalize } from "../../common/strings";
import { SealedFieldError } from "../../common/errors";
import { Leaves } from "../../types";
import { v20250101, v20241001 } from "./refinements";

// Liste des champs éditables sur l'objet Bsvhu
export type BsvhuEditableFields = Required<
  Omit<
    ZodBsvhu,
    | "id"
    | "isDraft"
    | "isDeleted"
    | "emitterCustomInfo"
    | "emitterNotOnTD"
    | "destinationCustomInfo"
    | "emitterEmissionSignatureDate"
    | "emitterEmissionSignatureAuthor"
    | "transporterTransportSignatureDate"
    | "transporterTransportSignatureAuthor"
    | "destinationOperationSignatureDate"
    | "destinationOperationSignatureAuthor"
    | "destinationReceptionSignatureDate"
    | "destinationReceptionSignatureAuthor"
    | "intermediariesOrgIds"
  >
>;

type RuleContext<T extends ZodBsvhu> = {
  // BSVHU persisté en base - avant modification
  persisted: T;
  // Liste des "rôles" que l'utilisateur a sur le Bsvhu (ex: émetteur, transporteur, etc).
  // Permet de conditionner un check a un rôle. Ex: "Ce champ est modifiable mais uniquement par l'émetteur"
  userFunctions: BsvhuUserFunctions;
};

// Fonction permettant de définir une signature de champ requis ou
// verrouilage de champ à partir des données du Bsvhu et du contexte
type GetBsvhuSignatureTypeFn<T extends ZodBsvhu> = (
  bsvhu: T,
  ruleContext?: RuleContext<T>
) => SignatureTypeInput | undefined;

export type EditionRulePath = Leaves<BsvhuInput, 5>;

// Règle d'édition qui permet de définir à partir de quelle signature
// un champ est verrouillé / requis avec une config contenant un paramètre
// optionnel `when`
export type EditionRule<T extends ZodBsvhu> = {
  // Signature à partir de laquelle le champ est requis ou fonction
  // permettant de calculer cette signature
  from: SignatureTypeInput | GetBsvhuSignatureTypeFn<T>;
  // Condition supplémentaire à vérifier pour que le champ soit requis.
  when?: (
    bsvhu: T,
    currentSignatureType: SignatureTypeInput | undefined
  ) => boolean;
  customErrorMessage?: string;
};

export type EditionRules<T extends ZodBsvhu, E extends BsvhuEditableFields> = {
  [Key in keyof E]: {
    // At what signature the field is sealed, and under which circumstances
    sealed: EditionRule<T>;
    // At what signature the field is required, and under which circumstances. If absent, field is never required
    required?: EditionRule<T>;
    readableFieldName?: string; // A custom field name for errors
    // a path to return in the errors to help the front display the error in context
    path?: EditionRulePath;
  };
};

type BsvhuEditionRules = EditionRules<ZodBsvhu, BsvhuEditableFields>;

/**
 * Régle de verrouillage des champs définie à partir d'une fonction.
 * Un champ appliquant cette règle est verrouillé à partir de la
 * signature émetteur sauf si l'utilisateur est l'émetteur, auquel cas
 * il peut encore modifier le champ jusqu'à la signature suivante.
 */
const sealedFromEmissionExceptForEmitter: GetBsvhuSignatureTypeFn<ZodBsvhu> = (
  _,
  context
) => {
  const { isEmitter } = context!.userFunctions;
  return isEmitter ? "TRANSPORT" : "EMISSION";
};

/**
 * DOCUMENTATION AUTOMATIQUE
 * voir CONTRIBUTING -> Mettre à jour la documentation
 * pour plus de détails
 */
export const bsvhuEditionRules: BsvhuEditionRules = {
  customId: {
    sealed: { from: "OPERATION" },
    readableFieldName: "Le numéro libre"
  },
  createdAt: {
    sealed: { from: "EMISSION" }
  },
  emitterAgrementNumber: {
    sealed: {
      // EMISSION ou TRANSPORT si émetteur
      from: sealedFromEmissionExceptForEmitter
    },
    readableFieldName: "Le N° d'agrément de l'émetteur",
    path: ["emitter", "agrementNumber"]
  },
  emitterIrregularSituation: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    readableFieldName: "La situation (irrégulière ou non) de l'émetteur",
    path: ["emitter", "irregularSituation"]
  },
  emitterNoSiret: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    readableFieldName: "La présence ou absence de SIRET de l'émetteur",
    path: ["emitter", "noSiret"]
  },
  emitterCompanyName: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "La raison sociale de l'émetteur",
    path: ["emitter", "company", "name"]
  },
  emitterCompanySiret: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: {
      from: "EMISSION",
      // il y a un SIRET émetteur
      when: bsvhu => !bsvhu.emitterNoSiret
    },
    readableFieldName: "Le SIRET de l'émetteur",
    path: ["emitter", "company", "siret"]
  },
  emitterCompanyAddress: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: {
      from: "EMISSION",
      // il n'y a pas street/city/postalCode
      when: bsvhu =>
        !bsvhu.emitterCompanyStreet ||
        !bsvhu.emitterCompanyCity ||
        !bsvhu.emitterCompanyPostalCode
    },
    readableFieldName: "L'adresse de l'émetteur",
    path: ["emitter", "company", "address"]
  },
  emitterCompanyStreet: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: {
      from: "EMISSION",
      // il n'y a pas d'adresse
      when: bsvhu => !bsvhu.emitterCompanyAddress
    },
    readableFieldName: "L'adresse de l'émetteur",
    path: ["emitter", "company", "street"]
  },
  emitterCompanyCity: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: {
      from: "EMISSION",
      // il n'y a pas d'adresse
      when: bsvhu => !bsvhu.emitterCompanyAddress
    },
    readableFieldName: "L'adresse de l'émetteur",
    path: ["emitter", "company", "city"]
  },
  emitterCompanyPostalCode: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: {
      from: "EMISSION",
      // il n'y a pas d'adresse
      when: bsvhu => !bsvhu.emitterCompanyAddress
    },
    readableFieldName: "L'adresse de l'émetteur",
    path: ["emitter", "company", "postalCode"]
  },
  emitterCompanyContact: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: {
      from: "EMISSION",
      // emitter.noSiret est false
      when: bsvhu => !bsvhu.emitterNoSiret
    },
    readableFieldName: "La personne à contacter chez l'émetteur",
    path: ["emitter", "company", "contact"]
  },
  emitterCompanyPhone: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: {
      from: "EMISSION",
      // emitter.emitterIrregularSituation est false
      when: bsvhu => !bsvhu.emitterIrregularSituation
    },
    readableFieldName: "Le N° de téléphone de l'émetteur",
    path: ["emitter", "company", "phone"]
  },
  emitterCompanyMail: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: {
      from: "EMISSION",
      // emitter.emitterIrregularSituation est false
      when: bsvhu => !bsvhu.emitterIrregularSituation
    },
    readableFieldName: "L'adresse e-mail de l'émetteur",
    path: ["emitter", "company", "mail"]
  },
  destinationType: {
    sealed: { from: "TRANSPORT" },
    required: { from: "EMISSION" },
    readableFieldName: "Le type de destination",
    path: ["destination", "type"]
  },
  destinationPlannedOperationCode: {
    sealed: { from: "TRANSPORT" },
    required: { from: "EMISSION" },
    readableFieldName: "L'opération prévue",
    path: ["destination", "plannedOperationCode"]
  },
  destinationAgrementNumber: {
    sealed: { from: "OPERATION" },
    readableFieldName: "Le N° d'agrément du destinataire",
    path: ["destination", "agrementNumber"]
  },
  destinationCompanyName: {
    sealed: { from: "TRANSPORT" },
    required: { from: "EMISSION" },
    readableFieldName: "La raison sociale du destinataire",
    path: ["destination", "company", "name"]
  },
  destinationCompanySiret: {
    sealed: { from: "TRANSPORT" },
    required: { from: "EMISSION" },
    readableFieldName: "Le SIRET du destinataire",
    path: ["destination", "company", "siret"]
  },
  destinationCompanyAddress: {
    sealed: { from: "TRANSPORT" },
    required: { from: "EMISSION" },
    readableFieldName: "L'adresse du destinataire",
    path: ["destination", "company", "address"]
  },
  destinationCompanyContact: {
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION" },
    readableFieldName: "La personne à contacter chez le destinataire",
    path: ["destination", "company", "contact"]
  },
  destinationCompanyPhone: {
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION" },
    readableFieldName: "Le N° de téléphone du destinataire",
    path: ["destination", "company", "phone"]
  },
  destinationCompanyMail: {
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION" },
    readableFieldName: "L'adresse e-mail du destinataire",
    path: ["destination", "company", "mail"]
  },
  destinationReceptionAcceptationStatus: {
    sealed: { from: "RECEPTION", when: isReceptionDataSealed },
    required: { from: "RECEPTION" },
    readableFieldName: "Le statut d'acceptation du destinataire",
    path: ["destination", "reception", "acceptationStatus"]
  },
  destinationReceptionRefusalReason: {
    sealed: { from: "RECEPTION", when: isReceptionDataSealed },
    readableFieldName: "La raison du refus par le destinataire",
    required: {
      from: "RECEPTION",
      // le déchet est refusé ou partiellement refusé
      when: isRefusedOrPartiallyRefused
    },
    path: ["destination", "reception", "refusalReason"]
  },
  destinationReceptionWeight: {
    sealed: { from: "RECEPTION", when: isReceptionDataSealed },
    required: { from: "RECEPTION" },
    readableFieldName: "Le poids réel reçu",
    path: ["destination", "reception", "weight"]
  },
  destinationReceptionDate: {
    readableFieldName: "la date de réception",
    required: { from: "RECEPTION", when: isReceptionSignatureStep },
    sealed: { from: "RECEPTION", when: isReceptionDataSealed },
    path: ["destination", "reception", "date"]
  },
  destinationReceptionIdentificationNumbers: {
    sealed: { from: "OPERATION" },
    readableFieldName:
      "Les numéros d'identification à la réception par le destinataire",
    path: ["destination", "reception", "identification", "numbers"]
  },
  destinationReceptionIdentificationType: {
    sealed: { from: "OPERATION" },
    readableFieldName:
      "Le type de numéro d'identification à la réception par le destinataire",
    path: ["destination", "reception", "identification", "type"]
  },
  destinationOperationCode: {
    sealed: { from: "OPERATION" },
    required: {
      from: "OPERATION",
      // le déchet n'est pas refusé
      when: isNotRefused
    },
    readableFieldName: "L'opération réalisée par le destinataire",
    path: ["destination", "operation", "code"]
  },
  destinationOperationMode: {
    sealed: { from: "OPERATION" },
    readableFieldName: "Le mode de traitement",
    path: ["destination", "operation", "mode"]
  },
  destinationOperationDate: {
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION", when: isNotRefused },
    readableFieldName: "la date de l'opération",
    path: ["destination", "operation", "date"]
  },
  destinationOperationNextDestinationCompanySiret: {
    sealed: { from: "OPERATION" },
    readableFieldName: "Le SIRET de l'exutoire",
    path: ["destination", "operation", "nextDestination", "company", "siret"]
  },
  destinationOperationNextDestinationCompanyVatNumber: {
    sealed: { from: "OPERATION" },
    readableFieldName: "Le N° de TVA de l'exutoire",
    path: [
      "destination",
      "operation",
      "nextDestination",
      "company",
      "vatNumber"
    ]
  },
  destinationOperationNextDestinationCompanyName: {
    sealed: { from: "OPERATION" },
    required: {
      from: "OPERATION",
      // il y a un SIRET d'exutoire
      when: bsvhu =>
        Boolean(bsvhu.destinationOperationNextDestinationCompanySiret)
    },
    readableFieldName: "La raison sociale de l'exutoire",
    path: ["destination", "operation", "nextDestination", "company", "name"]
  },
  destinationOperationNextDestinationCompanyAddress: {
    sealed: { from: "OPERATION" },
    required: {
      from: "OPERATION",
      // il y a un SIRET d'exutoire
      when: bsvhu =>
        Boolean(bsvhu.destinationOperationNextDestinationCompanySiret)
    },
    readableFieldName: "L'adresse de l'exutoire",
    path: ["destination", "operation", "nextDestination", "company", "address"]
  },
  destinationOperationNextDestinationCompanyContact: {
    sealed: { from: "OPERATION" },
    required: {
      from: "OPERATION",
      // il y a un SIRET d'exutoire
      when: bsvhu =>
        Boolean(bsvhu.destinationOperationNextDestinationCompanySiret)
    },
    readableFieldName: "La personne à contacter chez l'exutoire",
    path: ["destination", "operation", "nextDestination", "company", "contact"]
  },
  destinationOperationNextDestinationCompanyPhone: {
    sealed: { from: "OPERATION" },
    required: {
      from: "OPERATION",
      // il y a un SIRET d'exutoire
      when: bsvhu =>
        Boolean(bsvhu.destinationOperationNextDestinationCompanySiret)
    },
    readableFieldName: "Le N° de téléphone de l'exutoire",
    path: ["destination", "operation", "nextDestination", "company", "phone"]
  },
  destinationOperationNextDestinationCompanyMail: {
    sealed: { from: "OPERATION" },
    required: {
      from: "OPERATION",
      // il y a un SIRET d'exutoire
      when: bsvhu =>
        Boolean(bsvhu.destinationOperationNextDestinationCompanySiret)
    },
    readableFieldName: "L'adresse e-mail de l'exutoire",
    path: ["destination", "operation", "nextDestination", "company", "mail"]
  },
  destinationReceptionQuantity: {
    sealed: { from: "OPERATION" },
    readableFieldName: "La quantité de VHUs reçue",
    path: ["destination", "reception", "quantity"]
  },
  wasteCode: {
    sealed: {
      from: sealedFromEmissionExceptForEmitter
    },
    required: { from: "EMISSION" },
    readableFieldName: "Le code déchet",
    path: ["wasteCode"]
  },
  packaging: {
    sealed: {
      from: sealedFromEmissionExceptForEmitter
    },
    required: { from: "EMISSION" },
    readableFieldName: "Le type d'empaquetage",
    path: ["packaging"]
  },
  identificationNumbers: {
    sealed: {
      from: sealedFromEmissionExceptForEmitter
    },
    required: {
      from: "EMISSION",
      // le BSVHU a été créé après la MàJ 2024.10.1
      when: bsvhu => {
        return (bsvhu.createdAt || new Date()).getTime() >= v20241001.getTime();
      }
    },
    readableFieldName: "Le détail des identifications",
    path: ["identification", "numbers"]
  },
  identificationType: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: {
      from: "EMISSION",
      // le conditionnement est à l'unité
      when: bsvhu => bsvhu.packaging === "UNITE"
    },

    readableFieldName: "Le type de numéro d'identification",
    path: ["identification", "type"]
  },
  quantity: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "La quantité",
    path: ["quantity"]
  },
  weightValue: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "Le poids",
    path: ["weight", "value"]
  },
  weightIsEstimate: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    readableFieldName: "Le champ pour indiquer si le poids est estimé",
    path: ["weight", "isEstimate"]
  },
  transporterCompanySiret: {
    readableFieldName: "le SIRET du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      // le transporteur n'a pas de numéro de TVA renseigné
      when: bsvhu => !bsvhu.transporterCompanyVatNumber
    },
    path: ["transporter", "company", "siret"]
  },
  transporterCompanyVatNumber: {
    readableFieldName: "Le N° de TVA du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      // le transporteur n'a pas de SIRET renseigné
      when: bsvhu => !bsvhu.transporterCompanySiret
    },
    path: ["transporter", "company", "vatNumber"]
  },
  transporterCompanyName: {
    readableFieldName: "Le nom du transporteur",
    sealed: {
      from: "TRANSPORT"
    },
    required: { from: "TRANSPORT" },
    path: ["transporter", "company", "name"]
  },
  transporterCompanyAddress: {
    readableFieldName: "L'adresse du transporteur",
    sealed: {
      from: "TRANSPORT"
    },
    required: { from: "TRANSPORT" },
    path: ["transporter", "company", "address"]
  },
  transporterCompanyContact: {
    readableFieldName: "Le nom de contact du transporteur",
    sealed: {
      from: "TRANSPORT"
    },
    required: { from: "TRANSPORT" },
    path: ["transporter", "company", "contact"]
  },
  transporterCompanyPhone: {
    readableFieldName: "Le téléphone du transporteur",
    sealed: {
      from: "TRANSPORT"
    },
    required: { from: "TRANSPORT" },
    path: ["transporter", "company", "phone"]
  },
  transporterCompanyMail: {
    readableFieldName: "L'email du transporteur",
    sealed: {
      from: "TRANSPORT"
    },
    required: { from: "TRANSPORT" },
    path: ["transporter", "company", "mail"]
  },
  transporterRecepisseNumber: {
    readableFieldName: "le numéro de récépissé du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      // le transporteur est FR et non exempt de récépissé
      when: requireTransporterRecepisse,
      customErrorMessage:
        "L'établissement doit renseigner son récépissé dans Trackdéchets"
    },
    path: ["transporter", "recepisse", "number"]
  },
  transporterRecepisseDepartment: {
    readableFieldName: "le département de récépissé du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: requireTransporterRecepisse,
      customErrorMessage:
        "L'établissement doit renseigner son récépissé dans Trackdéchets"
    },
    path: ["transporter", "recepisse", "department"]
  },
  transporterRecepisseValidityLimit: {
    readableFieldName: "la date de validité du récépissé du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: requireTransporterRecepisse,
      customErrorMessage:
        "L'établissement doit renseigner son récépissé dans Trackdéchets"
    },
    path: ["transporter", "recepisse", "validityLimit"]
  },
  transporterTransportTakenOverAt: {
    readableFieldName: "la date d'enlèvement du transporteur",
    sealed: { from: "TRANSPORT" },
    path: ["transporter", "transport", "takenOverAt"]
  },
  transporterRecepisseIsExempted: {
    readableFieldName: "l'exemption de récépissé du transporteur",
    sealed: { from: "TRANSPORT" },
    path: ["transporter", "recepisse", "isExempted"]
  },
  transporterTransportMode: {
    readableFieldName: "le mode de transport",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT"
    },
    path: ["transporter", "transport", "mode"]
  },
  transporterTransportPlates: {
    readableFieldName: "l'immatriculation du transporteur",
    sealed: { from: "TRANSPORT" },
    path: ["transporter", "transport", "plates"],
    required: {
      from: "TRANSPORT",
      // le transport est routier et le BSVHU a été créé après la MàJ 2025.01.1
      when: bsvhu => {
        return (
          bsvhu.transporterTransportMode === "ROAD" &&
          (bsvhu.createdAt || new Date()).getTime() >= v20250101.getTime()
        );
      }
    }
  },
  transporterCustomInfo: {
    readableFieldName:
      "les champs d'informations complémentaires du transporteur",
    sealed: { from: "TRANSPORT" }
  },
  ecoOrganismeName: {
    readableFieldName: "le nom de l'éco-organisme",
    sealed: { from: "OPERATION" },
    path: ["ecoOrganisme", "name"],
    required: {
      from: "TRANSPORT",
      // il y a un SIRET d'éco-organisme
      when: bsvhu => !!bsvhu.ecoOrganismeSiret
    }
  },
  ecoOrganismeSiret: {
    readableFieldName: "le SIRET de l'éco-organisme",
    sealed: { from: "OPERATION" },
    path: ["ecoOrganisme", "siret"]
  },
  brokerCompanyName: {
    readableFieldName: "le nom du courtier",
    sealed: {
      from: "OPERATION",
      // il y a un SIRET de courtier
      when: bsvhu => !!bsvhu.brokerCompanySiret
    },
    path: ["broker", "company", "name"]
  },
  brokerCompanySiret: {
    readableFieldName: "le SIRET du courtier",
    sealed: {
      from: "OPERATION",
      // il y a un SIRET de courtier
      when: bsvhu => !!bsvhu.brokerCompanySiret
    },
    path: ["broker", "company", "siret"]
  },
  brokerCompanyAddress: {
    readableFieldName: "l'adresse du courtier",
    sealed: {
      from: "OPERATION",
      // il y a un SIRET de courtier
      when: bsvhu => !!bsvhu.brokerCompanySiret
    },
    path: ["broker", "company", "address"]
  },
  brokerCompanyContact: {
    readableFieldName: "le nom de contact du courtier",
    sealed: {
      from: "OPERATION",
      // il y a un SIRET de courtier
      when: bsvhu => !!bsvhu.brokerCompanySiret
    },
    path: ["broker", "company", "contact"]
  },
  brokerCompanyPhone: {
    readableFieldName: "le téléphone du courtier",
    sealed: {
      from: "OPERATION",
      // il y a un SIRET de courtier
      when: bsvhu => !!bsvhu.brokerCompanySiret
    },
    path: ["broker", "company", "phone"]
  },
  brokerCompanyMail: {
    readableFieldName: "le mail du courtier",
    sealed: {
      from: "OPERATION",
      // il y a un SIRET de courtier
      when: bsvhu => !!bsvhu.brokerCompanySiret
    },
    path: ["broker", "company", "mail"]
  },
  brokerRecepisseNumber: {
    readableFieldName: "le numéro de récépissé du courtier",
    sealed: {
      from: "OPERATION",
      // il y a un SIRET de courtier
      when: bsvhu => !!bsvhu.brokerCompanySiret
    },
    path: ["broker", "recepisse", "number"]
  },
  brokerRecepisseDepartment: {
    readableFieldName: "le département du récépissé du courtier",
    sealed: {
      from: "OPERATION",
      // il y a un SIRET de courtier
      when: bsvhu => !!bsvhu.brokerCompanySiret
    },
    path: ["broker", "recepisse", "department"]
  },
  brokerRecepisseValidityLimit: {
    readableFieldName: "la date de validité du récépissé du courtier",
    sealed: {
      from: "OPERATION",
      // il y a un SIRET de courtier
      when: bsvhu => !!bsvhu.brokerCompanySiret
    },
    path: ["broker", "recepisse", "validityLimit"]
  },
  traderCompanyName: {
    readableFieldName: "le nom du négociant",
    sealed: {
      from: "OPERATION",
      // il y a un SIRET de négociant
      when: bsvhu => !!bsvhu.traderCompanySiret
    },
    path: ["trader", "company", "name"]
  },
  traderCompanySiret: {
    readableFieldName: "le SIRET du négociant",
    sealed: {
      from: "OPERATION",
      // il y a un SIRET de négociant
      when: bsvhu => !!bsvhu.traderCompanySiret
    },
    path: ["trader", "company", "siret"]
  },
  traderCompanyAddress: {
    readableFieldName: "l'adresse du négociant",
    sealed: {
      from: "OPERATION",
      // il y a un SIRET de négociant
      when: bsvhu => !!bsvhu.traderCompanySiret
    },
    path: ["trader", "company", "address"]
  },
  traderCompanyContact: {
    readableFieldName: "le nom de contact du négociant",
    sealed: {
      from: "OPERATION",
      // il y a un SIRET de négociant
      when: bsvhu => !!bsvhu.traderCompanySiret
    },
    path: ["trader", "company", "contact"]
  },
  traderCompanyPhone: {
    readableFieldName: "le téléphone du négociant",
    sealed: {
      from: "OPERATION",
      // il y a un SIRET de négociant
      when: bsvhu => !!bsvhu.traderCompanySiret
    },
    path: ["trader", "company", "phone"]
  },
  traderCompanyMail: {
    readableFieldName: "le mail du négociant",
    sealed: {
      from: "OPERATION",
      // il y a un SIRET de négociant
      when: bsvhu => !!bsvhu.traderCompanySiret
    },
    path: ["trader", "company", "mail"]
  },
  traderRecepisseNumber: {
    readableFieldName: "le numéro de récépissé du négociant",
    sealed: {
      from: "OPERATION",
      // il y a un SIRET de négociant
      when: bsvhu => !!bsvhu.traderCompanySiret
    },
    path: ["trader", "recepisse", "number"]
  },
  traderRecepisseDepartment: {
    readableFieldName: "le département du récépissé du négociant",
    sealed: {
      from: "OPERATION",
      // il y a un SIRET de négociant
      when: bsvhu => !!bsvhu.traderCompanySiret
    },
    path: ["trader", "recepisse", "department"]
  },
  traderRecepisseValidityLimit: {
    readableFieldName: "la date de validité du récépissé du courtier",
    sealed: {
      from: "OPERATION",
      // il y a un SIRET de négociant
      when: bsvhu => !!bsvhu.traderCompanySiret
    },
    path: ["trader", "recepisse", "validityLimit"]
  },
  intermediaries: {
    readableFieldName: "les intermédiaires",
    sealed: { from: "OPERATION" },
    path: ["intermediaries"]
  },
  containsElectricOrHybridVehicles: {
    readableFieldName: "comprend des véhicules électriques ou hybrides",
    sealed: { from: "OPERATION" },
    path: ["containsElectricOrHybridVehicles"]
  }
};

export const getRequiredAndSealedFieldPaths = async (
  bsvhu: ZodBsvhu,
  currentSignatures: SignatureTypeInput[],
  user: User | undefined
): Promise<{
  sealed: string[][];
}> => {
  const sealedFields: string[][] = [];
  const userFunctions = await getBsvhuUserFunctions(user, bsvhu);
  for (const bsvhuField of Object.keys(bsvhuEditionRules)) {
    const { sealed, path } =
      bsvhuEditionRules[bsvhuField as keyof BsvhuEditableFields];
    if (path && sealed) {
      const isSealed = isBsvhuFieldSealed(sealed, bsvhu, currentSignatures, {
        persisted: bsvhu,
        userFunctions
      });
      if (isSealed) {
        sealedFields.push(path);
      }
    }
  }
  return {
    sealed: sealedFields
  };
};

function requireTransporterRecepisse(bsvhu: ZodBsvhu) {
  return (
    !bsvhu.transporterRecepisseIsExempted &&
    bsvhu.transporterTransportMode === TransportMode.ROAD &&
    !isForeignVat(bsvhu.transporterCompanyVatNumber)
  );
}

function isRefusedOrPartiallyRefused(bsvhu: ZodBsvhu) {
  return (
    !!bsvhu.destinationReceptionAcceptationStatus &&
    [
      WasteAcceptationStatus.REFUSED,
      WasteAcceptationStatus.PARTIALLY_REFUSED
    ].includes(bsvhu.destinationReceptionAcceptationStatus)
  );
}

function isReceptionSignatureStep(_, currentSignatureType: SignatureTypeInput) {
  return currentSignatureType === "RECEPTION";
}

function isReceptionDataSealed(bsvhu: ZodBsvhu) {
  return (
    Boolean(bsvhu.destinationReceptionSignatureDate) ||
    Boolean(bsvhu.destinationOperationSignatureDate)
  );
}

function isNotRefused(bsvhu: ZodBsvhu) {
  return (
    bsvhu.destinationReceptionAcceptationStatus !==
    WasteAcceptationStatus.REFUSED
  );
}

/**
 * Cette fonction permet de vérifier qu'un utilisateur n'est pas
 * en train d'essayer de modifier des données qui ont été verrouillée
 * par une signature
 * @param persisted BSVHU persisté en base
 * @param bsvhu BSVHU avec les modifications apportées par l'input
 * @param user Utilisateur qui effectue la modification
 */
export async function checkBsvhuSealedFields(
  persisted: ZodBsvhu,
  bsvhu: ZodBsvhu,
  context: BsvhuValidationContext
) {
  const sealedFieldErrors: string[] = [];

  const updatedFields = getUpdatedFields(persisted, bsvhu);

  const currentSignatureType =
    context.currentSignatureType ?? getCurrentSignatureType(persisted);

  // Some signatures may be skipped, so always check all the hierarchy
  const signaturesToCheck = getSignatureAncestors(currentSignatureType);

  const userFunctions = await getBsvhuUserFunctions(context.user, persisted);

  for (const field of updatedFields) {
    const { readableFieldName, sealed: sealedRule } =
      bsvhuEditionRules[field as keyof BsvhuEditableFields];

    const fieldDescription = readableFieldName
      ? capitalize(readableFieldName)
      : `Le champ ${field}`;

    const isSealed = isBsvhuFieldSealed(sealedRule, bsvhu, signaturesToCheck, {
      persisted,
      userFunctions
    });

    if (isSealed) {
      sealedFieldErrors.push(
        [fieldDescription, sealedRule.customErrorMessage]
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
  bsvhu: ZodBsvhu,
  context: BsvhuValidationContext
): Promise<(keyof BsvhuEditionRules)[]> {
  if (context.unsealed) {
    return [];
  }
  const currentSignatureType =
    context.currentSignatureType ?? getCurrentSignatureType(bsvhu);

  // Some signatures may be skipped, so always check all the hierarchy
  const signaturesToCheck = getSignatureAncestors(currentSignatureType);

  const userFunctions = await getBsvhuUserFunctions(context.user, bsvhu);

  const sealedFields = Object.entries(bsvhuEditionRules)
    .filter(([_, { sealed: sealedRule }]) => {
      const isSealed = isBsvhuFieldSealed(
        sealedRule,
        bsvhu,
        signaturesToCheck,
        {
          persisted: bsvhu,
          userFunctions
        }
      );

      return isSealed;
    })
    .map(([field]) => field as keyof BsvhuEditionRules);

  return sealedFields;
}

// Fonction utilitaire générique permettant d'appliquer une règle
// de verrouillage de champ ou de champ requis
// définie soit à partir d'une fonction soit à partir d'une config
function isRuleApplied<T extends ZodBsvhu>(
  rule: EditionRule<T>,
  resource: T,
  signatures: SignatureTypeInput[],
  context?: RuleContext<T>,
  currentSignatureType?: SignatureTypeInput | undefined
) {
  const from =
    typeof rule.from === "function" ? rule.from(resource, context) : rule.from;

  const isApplied =
    from &&
    signatures.includes(from) &&
    (rule.when === undefined || rule.when(resource, currentSignatureType));

  return isApplied;
}

function isBsvhuFieldSealed(
  rule: EditionRule<ZodBsvhu>,
  bsvhu: ZodBsvhu,
  signatures: SignatureTypeInput[],
  context?: RuleContext<ZodBsvhu>
) {
  return isRuleApplied(rule, bsvhu, signatures, context);
}

export function isBsvhuFieldRequired(
  rule: EditionRule<ZodBsvhu>,
  bsvhu: ZodBsvhu,
  signatures: SignatureTypeInput[],
  currentSignatureType: SignatureTypeInput | undefined
) {
  return isRuleApplied(
    rule,
    bsvhu,
    signatures,
    undefined,
    currentSignatureType
  );
}
