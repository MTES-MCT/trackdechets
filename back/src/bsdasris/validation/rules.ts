import { ZodBsdasri } from "./schema";
import { BsdasriUserFunctions, BsdasriValidationContext } from "./types";
import type { BsdasriInput, SignatureTypeInput } from "@td/codegen-back";
import {
  User,
  WasteAcceptationStatus,
  TransportMode,
  BsdasriType
} from "@prisma/client";

import { DASRI_PROCESSING_OPERATIONS_CODES, isForeignVat } from "@td/constants";
import {
  getBsdasriUserFunctions,
  getCurrentSignatureType,
  getSignatureAncestors,
  getUpdatedFields
} from "./helpers";
import { capitalize } from "../../common/strings";
import { SealedFieldError } from "../../common/errors";
import { Leaves } from "../../types";

// Liste des champs éditables sur l'objet Bsdasri
export type BsdasriEditableFields = Required<
  Omit<
    ZodBsdasri,
    | "id"
    | "isDraft"
    | "isDeleted"
    | "status"
    | "type"
    | "updatedAt"
    // | "emitterCustomInfo"
    | "emitterEmissionSignatureDate"
    | "emitterEmissionSignatureAuthor"
    | "isEmissionTakenOverWithSecretCode"
    | "transporterTransportSignatureDate"
    | "transporterTransportSignatureAuthor"
    // | "transporterCustomInfo"
    | "destinationOperationSignatureDate"
    | "destinationOperationSignatureAuthor"
    | "destinationReceptionSignatureDate"
    | "destinationReceptionSignatureAuthor"
    | "isEmissionDirectTakenOver"
    // | "destinationReceptionWasteVolume"
    | "emittedByEcoOrganisme"
    // | "destinationCustomInfo"
  >
>;

type RuleContext<T extends ZodBsdasri> = {
  // Dasri persisté en base - avant modification
  persisted: T;
  // Liste des "rôles" que l'utilisateur a sur le Dasri (ex: émetteur, transporteur, etc).
  // Permet de conditionner un check à un rôle. Ex: "Ce champ est modifiable mais uniquement par l'émetteur"
  userFunctions: BsdasriUserFunctions;
};

// Fonction permettant de définir une signature de champ requis ou
// verrouilage de champ à partir des données du Bsdasir et du contexte
type GetBsdasriSignatureTypeFn<T extends ZodBsdasri> = (
  bsdasri: T,
  ruleContext?: RuleContext<T>
) => SignatureTypeInput | undefined;

export type EditionRulePath = Leaves<BsdasriInput, 5>;

// Règle d'édition qui permet de définir à partir de quelle signature
// un champ est verrouillé / requis avec une config contenant un paramètre
// optionnel `when`
export type EditionRule<T extends ZodBsdasri> = {
  // Signature à partir de laquelle le champ est requis ou fonction
  // permettant de calculer cette signature
  from: SignatureTypeInput | GetBsdasriSignatureTypeFn<T>;
  // Condition supplémentaire à vérifier pour que le champ soit requis.
  when?: (
    bsdasri: T,
    currentSignatureType: SignatureTypeInput | undefined
  ) => boolean;
  customErrorMessage?: string;
};

export type EditionRules<
  T extends ZodBsdasri,
  E extends BsdasriEditableFields
> = {
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

type BsdasriEditionRules = EditionRules<ZodBsdasri, BsdasriEditableFields>;

const sealedFromEmission: GetBsdasriSignatureTypeFn<ZodBsdasri> = (
  bsdasri,
  context
) => {
  if (bsdasri.type === "SYNTHESIS") {
    return "TRANSPORT";
  }

  const { isEcoOrganisme } = context!.userFunctions;

  return isEcoOrganisme && !bsdasri.emitterEmissionSignatureDate
    ? "TRANSPORT"
    : "EMISSION";
};

/**
 * DOCUMENTATION AUTOMATIQUE
 * voir CONTRIBUTING -> Mettre à jour la documentation
 * pour plus de détails
 */
export const bsdasriEditionRules: BsdasriEditionRules = {
  createdAt: {
    sealed: { from: "EMISSION" }
  },

  emitterCompanyName: {
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION",
      // il n'y a pas d'éco-organisme visé sur le bordereau
      when: bsdasri => !Boolean(bsdasri.ecoOrganismeSiret)
    },
    readableFieldName: "La raison sociale de l'émetteur",
    path: ["emitter", "company", "name"]
  },
  emitterCompanySiret: {
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION"
    },
    readableFieldName: "Le N° SIRET de l'émetteur",
    path: ["emitter", "company", "siret"]
  },

  emitterCompanyContact: {
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION"
    },
    readableFieldName: "La personne à contacter chez l'émetteur",
    path: ["emitter", "company", "contact"]
  },
  emitterCompanyPhone: {
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION"
    },
    readableFieldName: "Le N° de téléphone de l'émetteur",
    path: ["emitter", "company", "phone"]
  },
  emitterCompanyAddress: {
    sealed: { from: "EMISSION" },

    readableFieldName: "L'adresse de l'émetteur",
    path: ["emitter", "company", "address"]
  },

  emitterCompanyMail: {
    sealed: { from: "EMISSION" },

    readableFieldName: "L'adresse e-mail de l'émetteur",
    path: ["emitter", "company", "mail"]
  },
  emitterWasteVolume: {
    sealed: { from: "EMISSION" },

    readableFieldName: "Le volume de déchet émis"
  },
  emitterWasteWeightValue: {
    sealed: { from: "EMISSION" },
    readableFieldName: "Le poids de déchets émis",
    path: ["emitter", "emission", "weight", "value"]
  },
  emitterWasteWeightIsEstimate: {
    sealed: { from: "EMISSION" },
    readableFieldName: "Le type de pesée (réélle ou estimée)",
    path: ["emitter", "emission", "weight", "isEstimate"]
  },
  emitterWastePackagings: {
    sealed: { from: "EMISSION" },
    readableFieldName: "Le conditionnement de l'émetteur",
    required: {
      from: "EMISSION",
      when: bsdasri => !Boolean(bsdasri.isDraft)
    },
    path: ["emitter", "emission", "packagings"]
  },
  emitterCustomInfo: {
    sealed: { from: "EMISSION" },

    readableFieldName: "Le champ libre émetteur",
    path: ["emitter", "customInfo"]
  },

  // pickup
  emitterPickupSiteName: {
    readableFieldName: "Le nom de l'adresse de chantier ou de collecte",
    path: ["emitter", "pickupSite", "name"],
    sealed: {
      from: "EMISSION"
    }
  },
  emitterPickupSiteAddress: {
    readableFieldName: "L'adresse de collecte ou de chantier",
    path: ["emitter", "pickupSite", "address"],
    sealed: {
      from: "EMISSION"
    }
  },
  emitterPickupSiteCity: {
    readableFieldName: "La ville de l'adresse de collecte ou de chantier",
    path: ["emitter", "pickupSite", "city"],
    sealed: {
      from: "EMISSION"
    }
  },
  emitterPickupSitePostalCode: {
    readableFieldName: "Le code postal de l'adresse de collecte ou de chantier",
    path: ["emitter", "pickupSite", "postalCode"],
    sealed: {
      from: "EMISSION"
    }
  },
  emitterPickupSiteInfos: {
    readableFieldName: "Les informations de l'adresse de collecte",
    path: ["emitter", "pickupSite", "infos"],

    sealed: {
      from: "EMISSION"
    }
  },
  // transporter

  transporterCompanySiret: {
    readableFieldName: "le N° SIRET du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      // le transporteur n'a pas de numéro de TVA renseigné
      when: bsdasri => !bsdasri.transporterCompanyVatNumber
    },
    path: ["transporter", "company", "siret"]
  },
  transporterCompanyVatNumber: {
    readableFieldName: "Le N° de TVA du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      // le transporteur n'a pas de SIRET renseigné
      when: bsdasri => !bsdasri.transporterCompanySiret
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

  transporterRecepisseIsExempted: {
    readableFieldName: "l'exemption de récépissé du transporteur",
    sealed: { from: "TRANSPORT" },
    path: ["transporter", "recepisse", "isExempted"]
  },
  transporterTakenOverAt: {
    readableFieldName: "la date d'enlèvement du transporteur",
    sealed: { from: "TRANSPORT" },
    path: ["transporter", "transport", "takenOverAt"]
  },

  transporterTransportMode: {
    readableFieldName: "le mode de transport",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      // S'il ne s'agit pas d'un bordereau de synthèse
      when: isNotSynthesis
    },
    path: ["transporter", "transport", "mode"]
  },
  transporterTransportPlates: {
    readableFieldName: "l'immatriculation du transporteur",
    sealed: { from: "TRANSPORT" },
    path: ["transporter", "transport", "plates"],
    required: {
      from: "TRANSPORT",
      // En cas de transport routier
      when: bsdasri => bsdasri.transporterTransportMode === "ROAD"
    }
  },
  transporterCustomInfo: {
    readableFieldName:
      "les champs d'informations complémentaires du transporteur",
    sealed: { from: "TRANSPORT" },
    path: ["transporter", "customInfo"]
  },

  transporterWastePackagings: {
    readableFieldName: "le conditionnement du transporteur",
    sealed: { from: "TRANSPORT" },
    path: ["transporter", "transport", "packagings"],
    required: {
      from: "TRANSPORT"
    }
  },
  transporterWasteWeightValue: {
    readableFieldName: "le poids du déchet du transporteur",
    path: ["transporter", "transport", "weight", "value"],
    sealed: { from: "TRANSPORT" }
  },
  transporterWasteWeightIsEstimate: {
    readableFieldName: "le poids du déchet est estimé",
    path: ["transporter", "transport", "weight", "isEstimate"],
    sealed: { from: "TRANSPORT" }
  },
  transporterWasteVolume: {
    readableFieldName: "le volume de déchet du transporteur",

    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT"
    }
  },
  transporterAcceptationStatus: {
    readableFieldName: "l'acceptation du déchet par le transporteur",

    path: ["transporter", "transport", "acceptation", "status"],

    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT"
    }
  },
  transporterWasteRefusedWeightValue: {
    readableFieldName: "le poids refusé par le transporteur",
    sealed: { from: "TRANSPORT" },
    path: ["transporter", "transport", "acceptation", "refusedWeight"],

    required: {
      from: "TRANSPORT",
      // le déchet est refusé ou partiellement refusé
      when: isRefusedOrPartiallyRefusedByTransporter
    }
  },
  transporterWasteRefusalReason: {
    readableFieldName: "la raison du refus par le transporteur",
    path: ["transporter", "transport", "acceptation", "refusalReason"],

    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: isRefusedOrPartiallyRefusedByTransporter
    }
  },

  // tranporter -> destination
  handedOverToRecipientAt: {
    readableFieldName: "remis au destinataire",
    path: ["transporter", "transport", "handedOverAt"],

    sealed: { from: "RECEPTION" }
  },

  // destination
  destinationCompanyName: {
    sealed: { from: "RECEPTION" },
    required: { from: "EMISSION" },
    readableFieldName: "La raison sociale du destinataire",
    path: ["destination", "company", "name"]
  },
  destinationCompanySiret: {
    sealed: { from: "RECEPTION" },
    required: { from: "EMISSION" },
    readableFieldName: "Le N° SIRET du destinataire",
    path: ["destination", "company", "siret"]
  },
  destinationCompanyAddress: {
    sealed: { from: "RECEPTION" },
    required: { from: "EMISSION" },
    readableFieldName: "L'adresse du destinataire",
    path: ["destination", "company", "address"]
  },
  destinationCompanyContact: {
    sealed: { from: "RECEPTION" },
    required: { from: "EMISSION" },
    readableFieldName: "La personne à contacter chez le destinataire",
    path: ["destination", "company", "contact"]
  },
  destinationCompanyPhone: {
    sealed: { from: "RECEPTION" },
    required: { from: "EMISSION" },
    readableFieldName: "Le N° de téléphone du destinataire",
    path: ["destination", "company", "phone"]
  },
  destinationCompanyMail: {
    sealed: { from: "RECEPTION" },
    // required: { from: "EMISSION" },
    readableFieldName: "L'adresse e-mail du destinataire",
    path: ["destination", "company", "mail"]
  },
  destinationCustomInfo: {
    sealed: { from: "OPERATION" },

    readableFieldName: "Les infos du destinataire",
    path: ["destination", "customInfo"]
  },

  destinationWastePackagings: {
    sealed: { from: "RECEPTION" },
    required: { from: "RECEPTION" },
    readableFieldName: "Le conditionnement reçu",
    path: ["destination", "reception", "packagings"]
  },
  destinationReceptionWasteVolume: {
    sealed: { from: "RECEPTION" },

    readableFieldName: "Le volume reçu"
  },
  destinationReceptionAcceptationStatus: {
    sealed: { from: "RECEPTION" },
    required: { from: "RECEPTION" },
    readableFieldName: "Le statut d'acceptation du destinataire",
    path: ["destination", "reception", "acceptation", "status"]
  },
  destinationReceptionWasteRefusalReason: {
    sealed: { from: "RECEPTION" },
    readableFieldName: "La raison du refus par le destinataire",
    required: {
      from: "RECEPTION",
      // le déchet est refusé ou partiellement refusé
      when: isRefusedOrPartiallyRefusedByDestination
    },
    path: ["destination", "reception", "acceptation", "refusalReason"]
  },
  destinationReceptionWasteWeightValue: {
    sealed: { from: "OPERATION" },
    required: {
      from: "OPERATION",
      // si opération finale
      when: isFinalOperation,

      customErrorMessage: "(Si le code correspond à un traitement final)"
    },
    readableFieldName: "Le poids du déchet traité en kg",
    path: ["destination", "operation", "weight", "value"]
  },
  destinationReceptionWasteRefusedWeightValue: {
    sealed: { from: "RECEPTION" },
    required: {
      from: "RECEPTION",
      // le déchet est refusé ou partiellement refusé
      when: isRefusedOrPartiallyRefusedByDestination
    },

    readableFieldName: "Le poids du déchet refusé",
    path: ["destination", "reception", "acceptation", "refusalReason"]
  },
  destinationReceptionDate: {
    readableFieldName: "la date de réception",
    required: { from: "RECEPTION", when: isReceptionSignatureStep },
    sealed: { from: "RECEPTION", when: isReceptionDataSealed },
    path: ["destination", "reception", "date"]
  },
  identificationNumbers: {
    sealed: { from: "RECEPTION" },
    readableFieldName:
      "Les numéros d'identification à la réception par le destinataire",
    path: ["identification", "numbers"]
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

  wasteCode: {
    sealed: {
      from: "EMISSION"
    },
    required: { from: "EMISSION" },
    readableFieldName: "Le code déchet",
    path: ["waste", "code"]
  },
  wasteAdr: {
    sealed: {
      from: "EMISSION"
    },
    required: { from: "EMISSION" },
    readableFieldName: "Le code adr",
    path: ["waste", "adr"]
  },

  ecoOrganismeName: {
    readableFieldName: "le nom de l'éco-organisme",
    sealed: { from: sealedFromEmission },
    path: ["ecoOrganisme", "name"],
    required: {
      from: "EMISSION",
      // il y a un SIRET d'éco-organisme
      when: bsdasri => !!bsdasri.ecoOrganismeSiret
    }
  },
  ecoOrganismeSiret: {
    readableFieldName: "le SIRET de l'éco-organisme",
    sealed: { from: sealedFromEmission },
    path: ["ecoOrganisme", "siret"],
    required: {
      from: "EMISSION",
      // il y a un Name d'éco-organisme
      when: bsdasri => !!bsdasri.ecoOrganismeName
    }
  },
  grouping: { sealed: { from: "EMISSION" } },
  synthesizing: { sealed: { from: "EMISSION" } }
};

export const getRequiredAndSealedFieldPaths = async (
  bsdasri: ZodBsdasri,
  currentSignatures: SignatureTypeInput[],
  user: User | undefined
): Promise<{
  sealed: string[][];
}> => {
  const sealedFields: string[][] = [];
  const userFunctions = await getBsdasriUserFunctions(user, bsdasri);
  for (const bsdasriField of Object.keys(bsdasriEditionRules)) {
    const { sealed, path } =
      bsdasriEditionRules[bsdasriField as keyof BsdasriEditableFields];
    if (path && sealed) {
      const isSealed = isBsdasriFieldSealed(
        sealed,
        bsdasri,
        currentSignatures,
        {
          persisted: bsdasri,
          userFunctions
        }
      );
      if (isSealed) {
        sealedFields.push(path);
      }
    }
  }
  return {
    sealed: sealedFields
  };
};

function requireTransporterRecepisse(bsdasri: ZodBsdasri) {
  return (
    !bsdasri.transporterRecepisseIsExempted &&
    bsdasri.transporterTransportMode === TransportMode.ROAD &&
    !isForeignVat(bsdasri.transporterCompanyVatNumber)
  );
}

function isRefusedOrPartiallyRefusedByTransporter(bsdasri: ZodBsdasri) {
  return (
    !!bsdasri.transporterAcceptationStatus &&
    [
      WasteAcceptationStatus.REFUSED,
      WasteAcceptationStatus.PARTIALLY_REFUSED
    ].includes(bsdasri.transporterAcceptationStatus)
  );
}

function isRefusedOrPartiallyRefusedByDestination(bsdasri: ZodBsdasri) {
  return (
    !!bsdasri.destinationReceptionAcceptationStatus &&
    [
      WasteAcceptationStatus.REFUSED,
      WasteAcceptationStatus.PARTIALLY_REFUSED
    ].includes(bsdasri.destinationReceptionAcceptationStatus)
  );
}

function isNotSynthesis(bsdasri: ZodBsdasri) {
  return bsdasri.type !== BsdasriType.SYNTHESIS;
}

function isReceptionSignatureStep(_, currentSignatureType: SignatureTypeInput) {
  return currentSignatureType === "RECEPTION";
}

function isReceptionDataSealed(bsdasri: ZodBsdasri) {
  return (
    Boolean(bsdasri.destinationReceptionSignatureDate) ||
    Boolean(bsdasri.destinationOperationSignatureDate)
  );
}

function isNotRefused(bsdasri: ZodBsdasri) {
  return (
    bsdasri.destinationReceptionAcceptationStatus !==
    WasteAcceptationStatus.REFUSED
  );
}

function isFinalOperation(bsdasri: ZodBsdasri) {
  return DASRI_PROCESSING_OPERATIONS_CODES.includes(
    bsdasri.destinationOperationCode || ""
  );
}

/**
 * Cette fonction permet de vérifier qu'un utilisateur n'est pas
 * en train d'essayer de modifier des données qui ont été verrouillée
 * par une signature
 * @param persisted Bsdasri persisté en base
 * @param bsdasri Bsdasri avec les modifications apportées par l'input
 * @param user Utilisateur qui effectue la modification
 */
export async function checkBsdasriSealedFields(
  persisted: ZodBsdasri,
  bsdasri: ZodBsdasri,
  context: BsdasriValidationContext
) {
  const sealedFieldErrors: string[] = [];

  const updatedFields = getUpdatedFields(persisted, bsdasri);

  const currentSignatureType =
    context.currentSignatureType ?? getCurrentSignatureType(persisted);

  // Some signatures may be skipped, so always check all the hierarchy
  const signaturesToCheck = getSignatureAncestors(currentSignatureType);

  const userFunctions = await getBsdasriUserFunctions(context.user, persisted);

  for (const field of updatedFields) {
    const { readableFieldName, sealed: sealedRule } =
      bsdasriEditionRules[field as keyof BsdasriEditableFields];

    const fieldDescription = readableFieldName
      ? capitalize(readableFieldName)
      : `Le champ ${field}`;

    const isSealed = isBsdasriFieldSealed(
      sealedRule,
      bsdasri,
      signaturesToCheck,
      {
        persisted,
        userFunctions
      }
    );

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
  bsdasri: ZodBsdasri,
  context: BsdasriValidationContext
): Promise<(keyof BsdasriEditionRules)[]> {
  if (context.unsealed) {
    return [];
  }
  const currentSignatureType =
    context.currentSignatureType ?? getCurrentSignatureType(bsdasri);

  // Some signatures may be skipped, so always check all the hierarchy
  const signaturesToCheck = getSignatureAncestors(currentSignatureType);

  const userFunctions = await getBsdasriUserFunctions(context.user, bsdasri);

  return Object.entries(bsdasriEditionRules)
    .filter(([_, { sealed: sealedRule }]) => {
      const isSealed = isBsdasriFieldSealed(
        sealedRule,
        bsdasri,
        signaturesToCheck,
        {
          persisted: bsdasri,
          userFunctions
        }
      );

      return isSealed;
    })
    .map(([field]) => field as keyof BsdasriEditionRules);
}

// Fonction utilitaire générique permettant d'appliquer une règle
// de verrouillage de champ ou de champ requis
// définie soit à partir d'une fonction soit à partir d'une config
function isRuleApplied<T extends ZodBsdasri>(
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

function isBsdasriFieldSealed(
  rule: EditionRule<ZodBsdasri>,
  bsdasri: ZodBsdasri,
  signatures: SignatureTypeInput[],
  context?: RuleContext<ZodBsdasri>
) {
  return isRuleApplied(rule, bsdasri, signatures, context);
}

export function isBsdasriFieldRequired(
  rule: EditionRule<ZodBsdasri>,
  bsdasri: ZodBsdasri,
  signatures: SignatureTypeInput[],
  currentSignatureType: SignatureTypeInput | undefined
) {
  return isRuleApplied(
    rule,
    bsdasri,
    signatures,
    undefined,
    currentSignatureType
  );
}
