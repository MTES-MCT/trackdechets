import { ZodBsvhu } from "./schema";
import { BsvhuUserFunctions } from "./types";
import { SignatureTypeInput } from "../../generated/graphql/types";
import { WasteAcceptationStatus } from "@prisma/client";
import { isForeignVat } from "@td/constants";

// Liste des champs éditables sur l'objet Bsvhu
export type BsvhuEditableFields = Required<
  Omit<
    ZodBsvhu,
    | "id"
    | "isDraft"
    | "isDeleted"
    | "emitterCustomInfo"
    | "destinationCustomInfo"
    | "transporterCustomInfo"
    | "transporterTransportPlates"
    | "emitterEmissionSignatureDate"
    | "emitterEmissionSignatureAuthor"
    | "transporterTransportSignatureDate"
    | "transporterTransportSignatureAuthor"
    | "destinationOperationSignatureDate"
    | "destinationOperationSignatureAuthor"
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

// Règle d'édition qui permet de définir à partir de quelle signature
// un champ est verrouillé / requis avec une config contenant un paramètre
// optionnel `when`
export type EditionRule<T extends ZodBsvhu> = {
  // Signature à partir de laquelle le champ est requis ou fonction
  // permettant de calculer cette signature
  from: SignatureTypeInput | GetBsvhuSignatureTypeFn<T>;
  // Condition supplémentaire à vérifier pour que le champ soit requis.
  when?: (bsvhu: T) => boolean;
  customErrorMessage?: string;
};

export type EditionRules<T extends ZodBsvhu, E extends BsvhuEditableFields> = {
  [Key in keyof E]: {
    // At what signature the field is sealed, and under which circumstances
    sealed: EditionRule<T>;
    // At what signature the field is required, and under which circumstances. If absent, field is never required
    required?: EditionRule<T>;
    readableFieldName?: string; // A custom field name for errors
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

export const bsvhuEditionRules: BsvhuEditionRules = {
  createdAt: {
    sealed: { from: "EMISSION" }
  },
  emitterAgrementNumber: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "Le N° d'agrément de l'émetteur"
  },
  emitterCompanyName: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "La raison sociale de l'émetteur"
  },
  emitterCompanySiret: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "Le N° SIRET de l'émetteur"
  },
  emitterCompanyAddress: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "L'adresse de l'émetteur"
  },
  emitterCompanyContact: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "La personne à contacter chez l'émetteur"
  },
  emitterCompanyPhone: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "Le N° de téléphone de l'émetteur"
  },
  emitterCompanyMail: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "L'adresse e-mail de l'émetteur"
  },
  // emitterEmissionSignatureAuthor: {
  //   sealed: { from: "EMISSION" },
  //   required: {
  //     from: "TRANSPORT",
  //     customErrorMessage:
  //       "Le transporteur ne peut pas signer l'enlèvement avant que l'émetteur ait signé le bordereau"
  //   },
  //   readableFieldName: "L'auteur de la signature émetteur"
  // },
  // emitterEmissionSignatureDate: {
  //   sealed: { from: "EMISSION" },
  //   required: {
  //     from: "TRANSPORT",
  //     customErrorMessage:
  //       "Le transporteur ne peut pas signer l'enlèvement avant que l'émetteur ait signé le bordereau"
  //   },
  //   readableFieldName: "La date de signature de l'émetteur"
  // },
  destinationType: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "Le type de destination"
  },
  destinationPlannedOperationCode: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "L'opération prévue"
  },
  destinationAgrementNumber: {
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION" },
    readableFieldName: "Le N° d'agrément du destinataire"
  },
  destinationCompanyName: {
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION" },
    readableFieldName: "La raison sociale du destinataire"
  },
  destinationCompanySiret: {
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION" },
    readableFieldName: "Le N° SIRET du destinataire"
  },
  destinationCompanyAddress: {
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION" },
    readableFieldName: "L'adresse du destinataire"
  },
  destinationCompanyContact: {
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION" },
    readableFieldName: "La personne à contacter chez le destinataire"
  },
  destinationCompanyPhone: {
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION" },
    readableFieldName: "Le N° de téléphone du destinataire"
  },
  destinationCompanyMail: {
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION" },
    readableFieldName: "L'adresse e-mail du destinataire"
  },
  destinationReceptionAcceptationStatus: {
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION" },
    readableFieldName: "Le statut d'acceptation du destinataire"
  },
  destinationReceptionRefusalReason: {
    sealed: { from: "OPERATION" },
    readableFieldName: "La raison du refus par le destinataire",
    required: { from: "OPERATION", when: isRefusedOrPartiallyRefused }
  },
  destinationReceptionIdentificationNumbers: {
    sealed: { from: "OPERATION" },
    readableFieldName:
      "Les numéros d'identification à la réception par le destinataire"
  },
  destinationReceptionIdentificationType: {
    sealed: { from: "OPERATION" },
    readableFieldName:
      "Le type de numéro d'identification à la réception par le destinataire"
  },
  destinationOperationCode: {
    sealed: { from: "OPERATION" },
    required: {
      from: "OPERATION",
      when: isNotRefused
    },
    readableFieldName: "L'opération réalisée par le destinataire"
  },
  destinationOperationMode: {
    sealed: { from: "OPERATION" },
    required: {
      from: "OPERATION",
      when: isNotRefused // more precise check in checkOperationMode refinement
    },
    readableFieldName: "Le mode de traitement"
  },
  destinationOperationDate: {
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION", when: isNotRefused },
    readableFieldName: "la date de l'opération"
  },
  destinationOperationNextDestinationCompanySiret: {
    sealed: { from: "OPERATION" },
    readableFieldName: "Le N° SIRET de l'exutoire"
  },
  destinationOperationNextDestinationCompanyVatNumber: {
    sealed: { from: "OPERATION" },
    readableFieldName: "Le N° de TVA de l'exutoire"
  },
  destinationOperationNextDestinationCompanyName: {
    sealed: { from: "OPERATION" },
    required: {
      from: "EMISSION",
      when: bsvhu =>
        Boolean(bsvhu.destinationOperationNextDestinationCompanySiret)
    },
    readableFieldName: "La raison sociale de l'exutoire"
  },
  destinationOperationNextDestinationCompanyAddress: {
    sealed: { from: "OPERATION" },
    required: {
      from: "EMISSION",
      when: bsvhu =>
        Boolean(bsvhu.destinationOperationNextDestinationCompanySiret)
    },
    readableFieldName: "L'adresse de l'exutoire"
  },
  destinationOperationNextDestinationCompanyContact: {
    sealed: { from: "OPERATION" },
    required: {
      from: "EMISSION",
      when: bsvhu =>
        Boolean(bsvhu.destinationOperationNextDestinationCompanySiret)
    },
    readableFieldName: "La personne à contacter chez l'exutoire"
  },
  destinationOperationNextDestinationCompanyPhone: {
    sealed: { from: "OPERATION" },
    required: {
      from: "EMISSION",
      when: bsvhu =>
        Boolean(bsvhu.destinationOperationNextDestinationCompanySiret)
    },
    readableFieldName: "Le N° de téléphone de l'exutoire"
  },
  destinationOperationNextDestinationCompanyMail: {
    sealed: { from: "OPERATION" },
    required: {
      from: "EMISSION",
      when: bsvhu =>
        Boolean(bsvhu.destinationOperationNextDestinationCompanySiret)
    },
    readableFieldName: "L'adresse e-mail de l'exutoire"
  },
  destinationReceptionQuantity: {
    sealed: { from: "OPERATION" },
    readableFieldName: "La quantité de VHUs reçue"
  },
  destinationReceptionWeight: {
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION" },
    readableFieldName: "Le poids réel reçu"
  },
  destinationReceptionDate: {
    readableFieldName: "la date de réception",
    sealed: { from: "OPERATION" }
    // required: { from: "OPERATION" }
  },
  wasteCode: {
    sealed: {
      from: sealedFromEmissionExceptForEmitter
    },
    required: { from: "EMISSION" },
    readableFieldName: "Le code déchet"
  },
  packaging: {
    sealed: {
      from: sealedFromEmissionExceptForEmitter
    },
    required: { from: "EMISSION" },
    readableFieldName: "Le type d'empaquetage"
  },
  identificationNumbers: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    readableFieldName: "Les numéros d'identification"
  },
  identificationType: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "Le type de numéro d'identification"
  },
  quantity: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "La quantité"
  },
  weightValue: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "Le poids"
  },
  weightIsEstimate: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    readableFieldName: "Le champ pour indiquer si le poids est estimé"
  },
  transporterCompanySiret: {
    readableFieldName: "le N° SIRET du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: bsvhu => !bsvhu.transporterCompanyVatNumber
    }
  },
  transporterCompanyVatNumber: {
    readableFieldName: "Le N° de TVA du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: bsvhu => !bsvhu.transporterCompanySiret
    }
  },
  transporterCompanyName: {
    readableFieldName: "Le nom du transporteur",
    sealed: {
      from: "TRANSPORT"
    },
    required: { from: "TRANSPORT" }
  },
  transporterCompanyAddress: {
    readableFieldName: "L'adresse du transporteur",
    sealed: {
      from: "TRANSPORT"
    },
    required: { from: "TRANSPORT" }
  },
  transporterCompanyContact: {
    readableFieldName: "Le nom de contact du transporteur",
    sealed: {
      from: "TRANSPORT"
    },
    required: { from: "TRANSPORT" }
  },
  transporterCompanyPhone: {
    readableFieldName: "Le téléphone du transporteur",
    sealed: {
      from: "TRANSPORT"
    },
    required: { from: "TRANSPORT" }
  },
  transporterCompanyMail: {
    readableFieldName: "L'email du transporteur",
    sealed: {
      from: "TRANSPORT"
    },
    required: { from: "TRANSPORT" }
  },
  transporterRecepisseNumber: {
    readableFieldName: "le numéro de récépissé du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: requireTransporterRecepisse,
      customErrorMessage:
        "L'établissement doit renseigner son récépissé dans Trackdéchets"
    }
  },
  transporterRecepisseDepartment: {
    readableFieldName: "le département de récépissé du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: requireTransporterRecepisse,
      customErrorMessage:
        "L'établissement doit renseigner son récépissé dans Trackdéchets"
    }
  },
  transporterRecepisseValidityLimit: {
    readableFieldName: "la date de validité du récépissé du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: requireTransporterRecepisse,
      customErrorMessage:
        "L'établissement doit renseigner son récépissé dans Trackdéchets"
    }
  },
  transporterTransportTakenOverAt: {
    readableFieldName: "la date d'enlèvement du transporteur",
    sealed: { from: "TRANSPORT" }
  },
  transporterRecepisseIsExempted: {
    readableFieldName: "l'exemption de récépissé du transporteur",
    sealed: { from: "TRANSPORT" }
    // required: {
    //   from: "TRANSPORT"
    // }
  }
};

function requireTransporterRecepisse(bsvhu: ZodBsvhu) {
  return (
    !bsvhu.transporterRecepisseIsExempted &&
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

function isNotRefused(bsvhu: ZodBsvhu) {
  return (
    bsvhu.destinationReceptionAcceptationStatus !==
    WasteAcceptationStatus.REFUSED
  );
}
