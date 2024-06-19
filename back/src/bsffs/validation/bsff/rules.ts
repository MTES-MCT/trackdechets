import { TransportMode } from "@prisma/client";
import {
  getBsffUserFunctions,
  getCurrentSignatureType,
  getSignatureAncestors,
  getUpdatedFields
} from "./helpers";
import { ZodBsff, ZodBsffPackaging, ZodBsffTransporter } from "./schema";
import { isForeignVat } from "@td/constants";
import {
  BsffUserFunctions,
  BsffValidationContext,
  AllBsffSignatureType
} from "./types";
import { capitalize } from "../../../common/strings";
import { SealedFieldError } from "../../../common/errors";

// Specs métier
// https://docs.google.com/spreadsheets/d/1Uvd04DsmTNiMr4wzpfmS2uLd84i6IzJsgXssxzy_2ns/edit#gid=0

// Liste des champs éditables sur l'objet Bsff
export type BsffEditableFields = Required<
  Omit<
    ZodBsff,
    | "id"
    | "isDraft"
    | "isDeleted"
    | "detenteurCompanySirets"
    | "transportersOrgIds"
  >
>;

// Liste des champs éditables sur l'objet BsffTransporter
export type BsffTransporterEditableFields = Required<
  Omit<
    ZodBsffTransporter,
    | "number"
    | "transporterTransportSignatureAuthor"
    | "transporterTransportSignatureDate"
  >
>;

// Liste des champs éditables sur l'objet BsffPackaging
export type BsffPackagingEditableFields = Required<
  Omit<
    ZodBsffPackaging,
    "id" | "acceptationSignatureDate" | "operationSignatureDate"
  >
>;

type RuleContext<T extends ZodBsff | ZodBsffTransporter | ZodBsffPackaging> = {
  // BSFF ou BsffTransporter ou BsffPackaging persisté en base - avant modification
  persisted: T;
  // Liste des "rôles" que l'utilisateur a sur le Bsff (ex: émetteur, transporteur, etc).
  // Permet de conditionner un check a un rôle. Ex: "Ce champ est modifiable mais uniquement par l'émetteur"
  userFunctions: BsffUserFunctions;
};

// Fonction permettant de définir une signature de champ requis ou
// verrouilage de champ à partir des données du Bsff et du contexte
type GetBsffSignatureTypeFn<
  T extends ZodBsff | ZodBsffTransporter | ZodBsffPackaging
> = (bsff: T, ruleContext?: RuleContext<T>) => AllBsffSignatureType | undefined;

// Règle d'édition qui permet de définir à partir de quelle signature
// un champ est verrouillé / requis avec une config contenant un paramètre
// optionnel `when`
export type EditionRule<
  T extends ZodBsff | ZodBsffTransporter | ZodBsffPackaging
> = {
  // Signature à partir de laquelle le champ est requis ou fonction
  // permettant de calculer cette signature
  from: AllBsffSignatureType | GetBsffSignatureTypeFn<T>;
  // Condition supplémentaire à vérifier pour que le champ soit requis.
  when?: (bsff: T) => boolean;
  customErrorMessage?: string;
};

export type EditionRules<
  T extends ZodBsff | ZodBsffTransporter | ZodBsffPackaging,
  E extends
    | BsffEditableFields
    | BsffTransporterEditableFields
    | BsffPackagingEditableFields
> = {
  [Key in keyof E]: {
    // At what signature the field is sealed, and under which circumstances
    sealed: EditionRule<T>;
    // At what signature the field is required, and under which circumstances. If absent, field is never required
    required?: EditionRule<T>;
    readableFieldName?: string; // A custom field name for errors
  };
};

type BsffEditionRules = EditionRules<ZodBsff, BsffEditableFields>;

type BsffTransporterEditionRules = EditionRules<
  ZodBsffTransporter,
  BsffTransporterEditableFields
>;

type BsffPackagingEditionRules = EditionRules<
  ZodBsffPackaging,
  BsffPackagingEditableFields
>;

function transporterSignature(
  transporter: ZodBsffTransporter
): AllBsffSignatureType {
  if (transporter.number && transporter.number > 1) {
    return `TRANSPORT_${transporter.number}` as AllBsffSignatureType;
  }
  return "TRANSPORT";
}

export const bsffTransporterEditionRules: BsffTransporterEditionRules = {
  id: {
    readableFieldName: "le transporteur",
    sealed: { from: transporterSignature }
  },
  bsffId: {
    readableFieldName: "le BSFF associé au transporteur",
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
      when: bsff => bsff.transporterTransportMode === "ROAD"
    }
  },
  transporterTransportTakenOverAt: {
    readableFieldName: "la date d'enlèvement du transporteur",
    sealed: { from: transporterSignature }
  }
};

function requireTransporterRecepisse(transporter: ZodBsffTransporter) {
  return (
    !transporter.transporterRecepisseIsExempted &&
    transporter.transporterTransportMode === TransportMode.ROAD &&
    !isForeignVat(transporter.transporterCompanyVatNumber)
  );
}

/**
 * Régle de verrouillage des champs définie à partir d'une fonction.
 * Un champ appliquant cette règle est verrouillé à partir de la
 * signature émetteur sauf si l'utilisateur est l'émetteur, auquel cas
 * il peut encore modifier le champ jusqu'à la signature suivante.
 */
const sealedFromEmissionExceptForEmitter: GetBsffSignatureTypeFn<ZodBsff> = (
  _,
  context
) => {
  const { isEmitter } = context!.userFunctions;
  return isEmitter ? "TRANSPORT" : "EMISSION";
};

export const bsffEditionRules: BsffEditionRules = {
  type: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" }
  },
  emitterCompanyName: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" }
  },
  emitterCompanySiret: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" }
  },
  emitterCompanyAddress: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" }
  },
  emitterCompanyContact: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" }
  },
  emitterCompanyPhone: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" }
  },
  emitterCompanyMail: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" }
  },
  emitterCustomInfo: {
    sealed: { from: sealedFromEmissionExceptForEmitter }
  },
  emitterEmissionSignatureAuthor: {
    sealed: { from: "EMISSION" },
    required: {
      from: "TRANSPORT",
      customErrorMessage:
        "Le transporteur ne peut pas signer l'enlèvement avant que l'émetteur ait signé le bordereau"
    }
  },
  emitterEmissionSignatureDate: {
    sealed: { from: "EMISSION" },
    required: {
      from: "TRANSPORT",
      customErrorMessage:
        "Le transporteur ne peut pas signer l'enlèvement avant que l'émetteur ait signé le bordereau"
    }
  },
  transporterTransportSignatureDate: {
    sealed: { from: "TRANSPORT" },
    required: {
      from: "RECEPTION",
      customErrorMessage:
        "L'installation de destination ne peut pas signer la réception avant que le transporteur ait signé le bordereau"
    }
  },
  wasteCode: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" }
  },
  wasteDescription: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" }
  },
  wasteAdr: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" }
  },
  weightValue: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" }
  },
  weightIsEstimate: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" }
  },
  destinationCompanyName: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" }
  },
  destinationCompanySiret: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" }
  },
  destinationCompanyAddress: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" }
  },
  destinationCompanyContact: {
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION" }
  },
  destinationCompanyPhone: {
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION" }
  },
  destinationPlannedOperationCode: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" }
  },
  destinationCompanyMail: {
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION" }
  },
  destinationCap: {
    sealed: { from: sealedFromEmissionExceptForEmitter }
  },
  destinationCustomInfo: {
    sealed: { from: "OPERATION" }
  },
  destinationReceptionDate: {
    sealed: { from: "RECEPTION" },
    required: { from: "RECEPTION" }
  },
  destinationReceptionSignatureAuthor: {
    sealed: { from: "RECEPTION" },
    required: {
      from: "ACCEPTATION",
      customErrorMessage:
        "L'installation de destination n'a pas encore signé la réception"
    }
  },
  destinationReceptionSignatureDate: {
    sealed: { from: "RECEPTION" },
    required: {
      from: "ACCEPTATION",
      customErrorMessage:
        "L'installation de destination n'a pas encore signé la réception"
    }
  },
  ficheInterventions: {
    sealed: { from: sealedFromEmissionExceptForEmitter }
  },
  transporters: {
    readableFieldName: "la liste des transporteurs",
    sealed: {
      // Le verrouillage des champs en fonction des signatures est géré plus finement
      // dans bsffTransporterEditionRules
      from: "RECEPTION"
    },
    required: {
      from: "TRANSPORT"
    }
  },
  packagings: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: {
      from: "EMISSION",
      // les contenants sont auto-complétés par un transformer en cas de réexpedition
      // ou de groupement
      when: bsff => bsff.type !== "GROUPEMENT" && bsff.type !== "REEXPEDITION"
    }
  },
  forwarding: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION", when: bsff => bsff.type === "REEXPEDITION" }
  },
  grouping: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION", when: bsff => bsff.type === "GROUPEMENT" }
  },
  repackaging: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: {
      from: "EMISSION",
      when: bsff => bsff.type === "RECONDITIONNEMENT"
    }
  }
};

export const bsffPackagingEditionRules: BsffPackagingEditionRules = {
  type: {
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" }
  },
  other: { sealed: { from: "EMISSION" } },
  volume: {
    sealed: { from: "EMISSION" }
    // En attente de https://favro.com/organization/ab14a4f0460a99a9d64d4945/2c84e07578945e0ee8fb61f3?card=tra-14567
    // required: { from: "EMISSION" }
  },
  weight: { sealed: { from: "EMISSION" }, required: { from: "EMISSION" } },
  emissionNumero: {
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" }
  },
  numero: {
    sealed: {
      from: "EMISSION"
    },
    required: { from: "EMISSION" }
  },
  previousPackagings: {
    sealed: { from: "EMISSION" }
  }
};

/**
 * Cette fonction permet de vérifier qu'un utilisateur n'est pas
 * en train d'essayer de modifier des données qui ont été verrouillée
 * par une signature
 * @param persisted BSFF persisté en base
 * @param bsff BSFF avec les modifications apportées par l'input
 * @param user Utilisateur qui effectue la modification
 */
export async function checkBsffSealedFields(
  persisted: ZodBsff,
  bsff: ZodBsff,
  context: BsffValidationContext
) {
  const sealedFieldErrors: string[] = [];

  const updatedFields = getUpdatedFields(persisted, bsff);

  const currentSignatureType =
    context.currentSignatureType ?? getCurrentSignatureType(persisted);

  // Some signatures may be skipped, so always check all the hierarchy
  const signaturesToCheck = getSignatureAncestors(currentSignatureType);

  const userFunctions = await getBsffUserFunctions(context.user, persisted);

  for (const field of updatedFields) {
    const { readableFieldName, sealed: sealedRule } =
      bsffEditionRules[field as keyof BsffEditableFields];

    const fieldDescription = readableFieldName
      ? capitalize(readableFieldName)
      : `Le champ ${field}`;

    const isSealed = isBsffFieldSealed(sealedRule, bsff, signaturesToCheck, {
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
    // Cas 1 : d'une modification des identifiants des transporteurs visés via le champ BsffInput.transporters
    // Cas 2 : d'une modification du premier transporteur via le champ BsffInput.transporter

    const persistedTransporters = persisted.transporters ?? [];
    const updatedTransporters = bsff.transporters ?? [];

    // Vérification du cas 1
    persistedTransporters.forEach((persistedTransporter, idx) => {
      const updatedTransporter = updatedTransporters[idx];
      if (persistedTransporter.id !== updatedTransporter?.id) {
        const rule = bsffTransporterEditionRules.id;
        const isSealed = isBsffTransporterFieldSealed(
          rule.sealed,
          { ...updatedTransporter, number: idx + 1 },
          signaturesToCheck
        );

        if (isSealed) {
          sealedFieldErrors.push(
            `Le transporteur n°${
              idx + 1
            } a déjà signé le BSFF, il ne peut pas être supprimé ou modifié`
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
          bsffTransporterEditionRules[
            transporterUpdatedField as keyof BsffTransporterEditableFields
          ];

        if (rule) {
          const isSealed = isBsffTransporterFieldSealed(
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
  bsff: ZodBsff,
  context: BsffValidationContext
) {
  const currentSignatureType =
    context.currentSignatureType ?? getCurrentSignatureType(bsff);
  // Some signatures may be skipped, so always check all the hierarchy
  const signaturesToCheck = getSignatureAncestors(currentSignatureType);

  const userFunctions = await getBsffUserFunctions(context.user, bsff);

  const sealedFields = Object.entries(bsffEditionRules)
    .filter(([_, { sealed: sealedRule }]) => {
      const isSealed = isBsffFieldSealed(sealedRule, bsff, signaturesToCheck, {
        persisted: bsff,
        userFunctions
      });

      return isSealed;
    })
    .map(([field]) => field as keyof BsffEditionRules);

  return sealedFields;
}

// Fonction utilitaire générique permettant d'appliquer une règle
// de verrouillage de champ ou de champ requis
// définie soit à partir d'une fonction soit à partir d'une config
function isRuleApplied<
  T extends ZodBsff | ZodBsffTransporter | ZodBsffPackaging
>(
  rule: EditionRule<T>,
  resource: T,
  signatures: AllBsffSignatureType[],
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

function isBsffFieldSealed(
  rule: EditionRule<ZodBsff>,
  bsff: ZodBsff,
  signatures: AllBsffSignatureType[],
  context?: RuleContext<ZodBsff>
) {
  return isRuleApplied(rule, bsff, signatures, context);
}

function isBsffTransporterFieldSealed(
  rule: EditionRule<ZodBsffTransporter>,
  bsffTransporter: ZodBsffTransporter,
  signatures: AllBsffSignatureType[],
  context?: RuleContext<ZodBsffTransporter>
) {
  return isRuleApplied(rule, bsffTransporter, signatures, context);
}

export function isBsffFieldRequired(
  rule: EditionRule<ZodBsff>,
  bsff: ZodBsff,
  signatures: AllBsffSignatureType[]
) {
  return isRuleApplied(rule, bsff, signatures);
}

export function isBsffTransporterFieldRequired(
  rule: EditionRule<ZodBsffTransporter>,
  bsffTransporter: ZodBsffTransporter,
  signatures: AllBsffSignatureType[]
) {
  return isRuleApplied(rule, bsffTransporter, signatures);
}

export function isBsffPackagingFieldRequired(
  rule: EditionRule<ZodBsffPackaging>,
  bsffPackaging: ZodBsffPackaging,
  signatures: AllBsffSignatureType[]
) {
  return isRuleApplied(rule, bsffPackaging, signatures);
}
