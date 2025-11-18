import { TransportMode } from "@td/prisma";
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
import { BsffPackagingInput, BsffTransporterInput } from "@td/codegen-back";
import { Leaves } from "../../../types";
import { BsffInput } from "@td/codegen-back";

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

export type EditionRulePath = Leaves<
  BsffInput & {
    transporters: {
      1: BsffTransporterInput;
      2: BsffTransporterInput;
      3: BsffTransporterInput;
      4: BsffTransporterInput;
      5: BsffTransporterInput;
    };
    packagings: {
      [key: number]: BsffPackagingInput;
    };
  },
  5
>;

export type TransporterEditionRulePath = Leaves<BsffTransporterInput, 5>;

export type PackagingEditionRulePath = Leaves<BsffPackagingInput, 5>;

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
    // a path to return in the errors to help the front display the error in context
    path?: T extends ZodBsff
      ? EditionRulePath
      : T extends ZodBsffPackaging
      ? PackagingEditionRulePath
      : TransporterEditionRulePath;
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
    readableFieldName: "Le transporteur",
    sealed: { from: transporterSignature }
  },
  bsffId: {
    readableFieldName: "Le BSFF associé au transporteur",
    sealed: { from: transporterSignature }
  },
  transporterCompanyName: {
    readableFieldName: "La raison sociale du transporteur",
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
    readableFieldName: "La personne à contacter du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature
    },
    path: ["company", "contact"]
  },
  transporterCompanyPhone: {
    readableFieldName: "Le N° de téléphone du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature
    },
    path: ["company", "phone"]
  },
  transporterCompanyMail: {
    readableFieldName: "L'adresse e-mail du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature
    },
    path: ["company", "mail"]
  },
  transporterCompanyVatNumber: {
    readableFieldName: "le numéro de TVA du transporteur",
    sealed: { from: transporterSignature },
    required: {
      from: transporterSignature,
      when: transporter => !transporter.transporterCompanySiret
    },
    path: ["company", "vatNumber"]
  },
  transporterCustomInfo: {
    readableFieldName: "Le champ libre du transporteur",
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
        "L'établissement doit renseigner son récépissé dans Trackdéchets"
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
        "L'établissement doit renseigner son récépissé dans Trackdéchets"
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
        "L'établissement doit renseigner son récépissé dans Trackdéchets"
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
      when: bsff => bsff.transporterTransportMode === "ROAD"
    },
    path: ["transport", "plates"]
  },
  transporterTransportTakenOverAt: {
    readableFieldName: "La date d'enlèvement",
    sealed: { from: transporterSignature },
    path: ["transport", "takenOverAt"]
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

/**
 * DOCUMENTATION AUTOMATIQUE
 * voir CONTRIBUTING -> Mettre à jour la documentation
 * pour plus de détails
 */
export const bsffEditionRules: BsffEditionRules = {
  createdAt: {
    sealed: { from: "EMISSION" }
  },
  type: {
    sealed: {
      // EMISSION ou TRANSPORT si émetteur
      from: sealedFromEmissionExceptForEmitter
    },
    required: { from: "EMISSION" },
    readableFieldName: "Le type de bordereau",
    path: ["type"]
  },
  emitterCompanyName: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "La raison sociale de l'émetteur",
    path: ["emitter", "company", "name"]
  },
  emitterCompanySiret: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "Le SIRET de l'émetteur",
    path: ["emitter", "company", "siret"]
  },
  emitterCompanyAddress: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "L'adresse de l'émetteur",
    path: ["emitter", "company", "address"]
  },
  emitterCompanyContact: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "La personne à contacter chez l'émetteur",
    path: ["emitter", "company", "contact"]
  },
  emitterCompanyPhone: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "Le N° de téléphone de l'émetteur",
    path: ["emitter", "company", "phone"]
  },
  emitterCompanyMail: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "L'adresse e-mail de l'émetteur",
    path: ["emitter", "company", "mail"]
  },
  emitterCustomInfo: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    readableFieldName: "le champ libre de l'émetteur",
    path: ["emitter", "customInfo"]
  },
  emitterEmissionSignatureAuthor: {
    sealed: { from: "EMISSION" },
    required: {
      from: "TRANSPORT",
      customErrorMessage:
        "Le transporteur ne peut pas signer l'enlèvement avant que l'émetteur ait signé le bordereau"
    },
    readableFieldName: "L'auteur de la signature émetteur",
    path: ["emitter"]
  },
  emitterEmissionSignatureDate: {
    sealed: { from: "EMISSION" },
    required: {
      from: "TRANSPORT",
      customErrorMessage:
        "Le transporteur ne peut pas signer l'enlèvement avant que l'émetteur ait signé le bordereau"
    },
    readableFieldName: "La date de signature de l'émetteur",
    path: ["emitter"]
  },
  transporterTransportSignatureDate: {
    sealed: { from: "TRANSPORT" },
    required: {
      from: "RECEPTION",
      customErrorMessage:
        "L'installation de destination ne peut pas signer la réception avant que le transporteur ait signé le bordereau"
    },
    readableFieldName: "La date de signature du transporteur",
    path: ["transporter", "transport"]
  },
  wasteCode: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "Le code déchet",
    path: ["waste", "code"]
  },
  wasteDescription: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "La description du déchet",
    path: ["waste", "description"]
  },
  wasteAdr: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "L'ADR",
    path: ["waste", "adr"]
  },
  weightValue: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "La quantité totale",
    path: ["weight", "value"]
  },
  weightIsEstimate: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "Le champ estimé ou non",
    path: ["weight", "isEstimate"]
  },
  destinationCompanyName: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "La raison sociale de l'installation de destination",
    path: ["destination", "company", "name"]
  },
  destinationCompanySiret: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "Le SIRET de l'installation de destination",
    path: ["destination", "company", "siret"]
  },
  destinationCompanyAddress: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "L'adresse de l'installation de destination",
    path: ["destination", "company", "address"]
  },
  destinationCompanyContact: {
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION" },
    readableFieldName:
      "La personne à contacter de l'installation de destination",
    path: ["destination", "company", "contact"]
  },
  destinationCompanyPhone: {
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION" },
    readableFieldName: "Le N° de téléphone de l'installation de destination",
    path: ["destination", "company", "phone"]
  },
  destinationPlannedOperationCode: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "Le code d'opération prévu",
    path: ["destination", "plannedOperationCode"]
  },
  destinationCompanyMail: {
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION" },
    readableFieldName: "L'adresse e-mail de l'installation de destination",
    path: ["destination", "company", "mail"]
  },
  destinationCap: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    readableFieldName: "Le CAP de l'installation de destination",
    path: ["destination", "cap"]
  },
  destinationCustomInfo: {
    sealed: { from: "OPERATION" },
    readableFieldName: "Le champ libre de l'installation de destination",
    path: ["destination", "customInfo"]
  },
  destinationReceptionDate: {
    sealed: { from: "RECEPTION" },
    required: { from: "RECEPTION" },
    readableFieldName: "La date de la réception",
    path: ["destination", "reception", "date"]
  },
  destinationReceptionSignatureAuthor: {
    sealed: { from: "RECEPTION" },
    required: {
      from: "ACCEPTATION",
      customErrorMessage:
        "L'installation de destination n'a pas encore signé la réception"
    },
    readableFieldName: "L'auteur de la signature de la réception",
    path: ["destination", "reception"]
  },
  destinationReceptionSignatureDate: {
    sealed: { from: "RECEPTION" },
    required: {
      from: "ACCEPTATION",
      customErrorMessage:
        "L'installation de destination n'a pas encore signé la réception"
    },
    readableFieldName: "La date de signature de la réception",
    path: ["destination", "reception"]
  },
  ficheInterventions: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    readableFieldName: "La liste des fiches d'intervention",
    path: ["ficheInterventions"]
  },
  transporters: {
    readableFieldName: "La liste des transporteurs",
    sealed: {
      // Le verrouillage des champs en fonction des signatures est géré plus finement
      // dans bsffTransporterEditionRules
      from: "RECEPTION"
    },
    required: {
      from: "TRANSPORT"
    },
    path: ["transporters"]
  },
  packagings: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: {
      from: "EMISSION",
      // il ne s'agit ni d'un groupement ni d'une réexpédition
      when: bsff => bsff.type !== "GROUPEMENT" && bsff.type !== "REEXPEDITION"
      // les contenants sont auto-complétés par un transformer en cas de réexpedition
      // ou de groupement
    },
    readableFieldName: "La liste des contenants",
    path: ["packagings"]
  },
  forwarding: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: {
      from: "EMISSION",
      // il s'agit d'une réexpédition
      when: bsff => bsff.type === "REEXPEDITION"
    },
    readableFieldName: "La liste des contenants à réexpedier",
    path: ["forwarding"]
  },
  grouping: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: {
      from: "EMISSION",
      // il s'agit d'un groupement
      when: bsff => bsff.type === "GROUPEMENT"
    },
    readableFieldName: "La liste des contenants à grouper",
    path: ["grouping"]
  },
  repackaging: {
    sealed: { from: sealedFromEmissionExceptForEmitter },
    required: {
      from: "EMISSION",
      // il s'agit d'un reconditionnement
      when: bsff => bsff.type === "RECONDITIONNEMENT"
    },
    readableFieldName: "La liste des contenants à regrouper",
    path: ["repackaging"]
  }
};

export const bsffPackagingEditionRules: BsffPackagingEditionRules = {
  type: {
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" },
    readableFieldName: "Le type de contenant",
    path: ["type"]
  },
  other: {
    sealed: { from: "EMISSION" },
    readableFieldName: "Le type de contenant",
    path: ["other"]
  },
  volume: {
    sealed: { from: "EMISSION" },
    // En attente de https://favro.com/organization/ab14a4f0460a99a9d64d4945/2c84e07578945e0ee8fb61f3?card=tra-14567
    // required: { from: "EMISSION" }
    readableFieldName: "Le volume du contenant"
  },
  weight: {
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" },
    readableFieldName: "La masse du contenu"
  },
  emissionNumero: {
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" },
    readableFieldName: "Le numéro de contenant à l'émission"
  },
  numero: {
    sealed: {
      from: "EMISSION"
    },
    required: { from: "EMISSION" },
    readableFieldName: "Le numéro de contenant"
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
  bsff: ZodBsff,
  context: BsffValidationContext
): Promise<(keyof BsffEditionRules)[]> {
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
