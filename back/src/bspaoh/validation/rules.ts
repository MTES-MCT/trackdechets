import { Prisma, User, WasteAcceptationStatus } from "@prisma/client";
import { RefinementCtx, z } from "zod";
import {
  BspaohInput,
  BspaohSignatureType
} from "../../generated/graphql/types";
import { capitalize } from "../../common/strings";
import { ZodFullBspaoh } from "./schema";
import { isForeignVat } from "@td/constants";
import { UnparsedInputs } from ".";
import { getUserFunctions } from "./helpers";
import { Leaves } from "../../types";
import { BspaohForParsing } from "../types";

type EditableBspaohTransporterFields = Required<
  Omit<
    Prisma.BspaohTransporterCreateInput,
    | "id"
    | "number"
    | "createdAt"
    | "updatedAt"
    | "bspaoh"
    | "transporterTransportSignatureDate"
    | "transporterTransportSignatureAuthor"
  >
>;

type EditableBspaohFields = Required<
  Omit<
    Prisma.BspaohCreateInput,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "rowNumber"
    | "isDeleted"
    | "status"
    | "emitterEmissionSignatureDate"
    | "emitterEmissionSignatureAuthor"
    | "handedOverToDestinationSignatureDate"
    | "handedOverToDestinationSignatureAuthor"
    | "destinationReceptionSignatureDate"
    | "destinationReceptionSignatureAuthor"
    | "destinationOperationSignatureAuthor"
    | "destinationOperationSignatureDate"
    | "transporters"
    | "currentTransporterOrgId"
    | "nextTransporterOrgId"
    | "transportersSirets"
    | "canAccessDraftSirets"
    | "transporterTransportTakenOverAt"
  >
>;

type EditableFullBspaohFields = EditableBspaohFields &
  EditableBspaohTransporterFields;

type UserFunctions = Awaited<ReturnType<typeof getUserFunctions>>;
type PersistedBspaoh = Pick<UnparsedInputs, "persisted">["persisted"];
export type CheckFn = (
  val: ZodFullBspaoh,
  persistedBspaoh: PersistedBspaoh,
  userFunctions: UserFunctions
) => boolean;

export type FieldCheck<Key extends keyof EditableFullBspaohFields> = {
  from: BspaohSignatureType;
  when?: CheckFn;
  superRefine?: (val: ZodFullBspaoh[Key], ctx: RefinementCtx) => void; // For state specific validation rules. eg array must have length > 0 when the field is required
  suffix?: string; // A custom message at the end of the error
};

export type EditionRulePath = Leaves<BspaohInput, 5>;

export type BspaohEditionRules = {
  [Key in keyof EditableFullBspaohFields]: {
    // At what signature the field is sealed, and under which circumstances
    sealed: FieldCheck<Key>;
    // At what signature the field is required, and under which circumstances. If absent, field is never required
    required?: FieldCheck<Key>;
    readableFieldName?: string; // A custom field name for errors
    path?: EditionRulePath;
  };
};

export const editionRules: BspaohEditionRules = {
  wasteAdr: {
    sealed: { from: "EMISSION" },
    readableFieldName: "le code adr",
    path: ["waste", "adr"]
  },
  wasteType: {
    readableFieldName: "le type de déchet",
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" },
    path: ["waste", "type"]
  },
  wasteCode: {
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" },
    readableFieldName: "le code famille",
    path: ["waste", "code"]
  },

  wastePackagings: {
    readableFieldName: "le conditionnement",
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION",
      superRefine(val, ctx) {
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
    path: ["waste", "packagings"]
  },
  emitterCompanyName: {
    readableFieldName: "le nom de l'entreprise émettrice",
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" },
    path: ["emitter", "company", "name"]
  },
  emitterCompanySiret: {
    readableFieldName: "le SIRET de l'entreprise émettrice",
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" },
    path: ["emitter", "company", "siret"]
  },
  emitterCompanyAddress: {
    readableFieldName: "l'adresse de l'entreprise émettrice",
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" },
    path: ["emitter", "company", "address"]
  },
  emitterCompanyContact: {
    readableFieldName: "le nom de contact de l'entreprise émettrice",
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" },
    path: ["emitter", "company", "contact"]
  },
  emitterCompanyPhone: {
    readableFieldName: "le téléphone de l'entreprise émettrice",
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" },
    path: ["emitter", "company", "phone"]
  },
  emitterCompanyMail: {
    readableFieldName: "l'email de l'entreprise émettrice",
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" },
    path: ["emitter", "company", "mail"]
  },
  emitterCustomInfo: {
    readableFieldName:
      "les champs d'informations complémentaires de l'entreprise émettrice",
    sealed: { from: "EMISSION" },
    path: ["emitter", "customInfo"]
  },
  emitterPickupSiteName: {
    readableFieldName: "le nom de l'adresse de chantier ou de collecte",
    sealed: { from: "EMISSION" },
    path: ["emitter", "pickupSite", "name"]
  },
  emitterPickupSiteAddress: {
    readableFieldName: "l'adresse de collecte ou de chantier",
    sealed: { from: "EMISSION" },
    path: ["emitter", "pickupSite", "address"]
  },
  emitterPickupSiteCity: {
    readableFieldName: "la ville de l'adresse de collecte ou de chantier",
    sealed: { from: "EMISSION" },
    path: ["emitter", "pickupSite", "city"]
  },
  emitterPickupSitePostalCode: {
    readableFieldName: "le code postal de l'adresse de collecte ou de chantier",
    sealed: { from: "EMISSION" },
    path: ["emitter", "pickupSite", "postalCode"]
  },
  emitterPickupSiteInfos: {
    readableFieldName: "les informations de l'adresse de collecte",
    sealed: { from: "EMISSION" },
    path: ["emitter", "pickupSite", "infos"]
  },
  emitterWasteWeightValue: {
    readableFieldName: "le poids du déchet émis",
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION",
      when: bspaoh =>
        bspaoh.emitterWasteWeightIsEstimate !== null &&
        bspaoh.emitterWasteWeightIsEstimate !== undefined
    },
    path: ["emitter", "emission", "detail", "weight", "value"]
  },
  emitterWasteWeightIsEstimate: {
    readableFieldName: "la quantité émise",
    sealed: { from: "EMISSION" },
    path: ["emitter", "emission", "detail", "weight", "isEstimate"]
  },
  emitterWasteQuantityValue: {
    readableFieldName: "la quantité émise (nombre)",
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION",
      when: bspaoh => !bspaoh.emitterWasteWeightValue
    },
    path: ["emitter", "emission", "detail", "quantity"]
  },

  destinationCompanyName: {
    readableFieldName: "le nom de l'entreprise de destination",
    sealed: {
      from: "EMISSION",
      when: isDestinationSealed
    },
    required: { from: "EMISSION" },
    path: ["destination", "company", "name"]
  },
  destinationCompanySiret: {
    readableFieldName: "le SIRET de l'entreprise de destination",
    sealed: {
      from: "EMISSION",
      when: isDestinationSealed
    },
    required: { from: "EMISSION" },
    path: ["destination", "company", "siret"]
  },
  destinationCompanyAddress: {
    readableFieldName: "l'adresse de l'entreprise de destination",

    sealed: {
      from: "EMISSION",
      when: isDestinationSealed
    },
    required: { from: "EMISSION" },
    path: ["destination", "company", "address"]
  },
  destinationCompanyContact: {
    readableFieldName: "le nom de contact de l'entreprise de destination",
    sealed: {
      from: "EMISSION",
      when: isDestinationSealed
    },
    required: { from: "EMISSION" },
    path: ["destination", "company", "contact"]
  },
  destinationCompanyPhone: {
    readableFieldName: "le téléphone de l'entreprise de destination",
    sealed: {
      from: "EMISSION",
      when: isDestinationSealed
    },
    required: { from: "EMISSION" },
    path: ["destination", "company", "phone"]
  },
  destinationCompanyMail: {
    readableFieldName: "l'email de l'entreprise de destination",
    sealed: {
      from: "EMISSION",
      when: isDestinationSealed
    },
    required: { from: "EMISSION" },
    path: ["destination", "company", "mail"]
  },
  destinationCustomInfo: {
    readableFieldName:
      "les champs d'informations complémentaires de l'entreprise de destination",
    sealed: { from: "OPERATION" },
    path: ["destination", "customInfo"]
  },
  destinationCap: {
    readableFieldName: "le CAP du destinataire",
    sealed: { from: "TRANSPORT" },
    path: ["destination", "cap"]
  },

  destinationReceptionWasteReceivedWeightValue: {
    readableFieldName: "le poids du déchet reçu",
    sealed: { from: "RECEPTION" },
    path: ["destination", "reception", "detail", "receivedWeight"]
  },
  destinationReceptionWasteAcceptedWeightValue: {
    readableFieldName: "le poids du déchet accepté",
    sealed: { from: "RECEPTION" },
    path: ["destination", "reception", "detail", "receivedWeight"]
  },
  destinationReceptionWasteRefusedWeightValue: {
    readableFieldName: "le poids du déchet refusé",
    sealed: { from: "RECEPTION" },
    path: ["destination", "reception", "detail", "refusedWeight"]
  },

  destinationReceptionWasteQuantityValue: {
    readableFieldName: "la quantité remise (nombre)",
    sealed: {
      from: "RECEPTION"
    },
    path: ["destination", "reception", "detail", "quantity"]
  },

  destinationReceptionAcceptationStatus: {
    readableFieldName: "le champ d'acceptation du déchet",
    sealed: { from: "RECEPTION" },
    required: { from: "RECEPTION" },
    path: ["destination", "reception", "acceptation", "status"]
  },
  destinationReceptionWasteRefusalReason: {
    readableFieldName: "la raison du refus",
    sealed: { from: "RECEPTION" },
    required: { from: "RECEPTION", when: isRefusedOrPartiallyRefused },
    path: ["destination", "reception", "acceptation", "refusalReason"]
  },
  destinationReceptionDate: {
    readableFieldName: "la date de réception",
    sealed: { from: "RECEPTION" },
    required: { from: "RECEPTION" },
    path: ["destination", "reception", "date"]
  },
  destinationReceptionWastePackagingsAcceptation: {
    readableFieldName: "le detail des conditionnements reçus",
    sealed: { from: "RECEPTION" },
    required: { from: "RECEPTION" },
    path: ["destination", "reception", "acceptation", "packagings"]
  },
  destinationOperationCode: {
    readableFieldName: "le code d'opération de la destination",
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION" },
    path: ["destination", "operation", "code"]
  },
  destinationOperationDate: {
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION", when: isNotRefused },
    path: ["destination", "operation", "date"]
  },
  transporterCompanyName: {
    readableFieldName: "le nom du transporteur",
    sealed: { from: "TRANSPORT" },
    required: { from: "TRANSPORT" },
    path: ["transporter", "company", "name"]
  },
  transporterCompanySiret: {
    readableFieldName: "le SIRET du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "EMISSION",
      when: bspaoh => !bspaoh.transporterCompanyVatNumber
    },
    path: ["transporter", "company", "siret"]
  },
  transporterTakenOverAt: {
    readableFieldName: "la date de prise en charge par le transporteur",
    sealed: { from: "TRANSPORT" },
    required: { from: "TRANSPORT" },
    path: ["transporter", "transport", "takenOverAt"]
  },
  transporterCompanyAddress: {
    readableFieldName: "l'adresse du transporteur",
    sealed: { from: "TRANSPORT" },
    required: { from: "TRANSPORT" },
    path: ["transporter", "company", "address"]
  },
  transporterCompanyContact: {
    readableFieldName: "le nom de contact du transporteur",
    sealed: { from: "TRANSPORT" },
    required: { from: "TRANSPORT" },
    path: ["transporter", "company", "contact"]
  },
  transporterCompanyPhone: {
    readableFieldName: "le téléphone du transporteur",
    sealed: { from: "TRANSPORT" },
    required: { from: "TRANSPORT" },
    path: ["transporter", "company", "phone"]
  },
  transporterCompanyMail: {
    readableFieldName: "l'email du transporteur",
    sealed: { from: "TRANSPORT" },
    required: { from: "TRANSPORT" },
    path: ["transporter", "company", "mail"]
  },
  transporterCompanyVatNumber: {
    readableFieldName: "le numéro de TVA du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: bspaoh => !bspaoh.transporterCompanySiret
    },
    path: ["transporter", "company", "vatNumber"]
  },
  transporterCustomInfo: {
    readableFieldName:
      "les champs d'informations complémentaires du transporteur",
    sealed: { from: "TRANSPORT" },
    path: ["transporter", "customInfo"]
  },
  transporterRecepisseIsExempted: {
    readableFieldName: "l'exemption de récépissé du transporteur",
    sealed: { from: "TRANSPORT" },
    required: { from: "TRANSPORT" },
    path: ["transporter", "recepisse", "isExempted"]
  },
  transporterRecepisseNumber: {
    readableFieldName: "le numéro de récépissé du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: requireTransporterRecepisse,
      suffix: "L'établissement doit renseigner son récépissé dans Trackdéchets"
    },
    path: ["transporter", "recepisse"]
  },
  transporterRecepisseDepartment: {
    readableFieldName: "le département de récépissé du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: requireTransporterRecepisse,
      suffix: "L'établissement doit renseigner son récépissé dans Trackdéchets"
    },
    path: ["transporter", "recepisse"]
  },
  transporterRecepisseValidityLimit: {
    readableFieldName: "la date de validaté du récépissé du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: requireTransporterRecepisse,
      suffix: "L'établissement doit renseigner son récépissé dans Trackdéchets"
    },
    path: ["transporter", "recepisse"]
  },
  transporterTransportMode: {
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT"
    },
    readableFieldName: "le mode de transport",
    path: ["transporter", "transport", "mode"]
  },
  transporterTransportPlates: {
    sealed: { from: "TRANSPORT" },
    readableFieldName: "la plaque d'immatriculation",
    required: {
      from: "TRANSPORT",
      when: bspaoh => bspaoh?.transporterTransportMode === "ROAD",
      superRefine(val, ctx) {
        if (val.filter(Boolean).length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "La plaque d'immatriculation est requise",
            path: ["transporterTransportPlates"]
          });
        }
      }
    },
    path: ["transporter", "transport", "plates"]
  }
};

function isNotRefused(bspaoh: ZodFullBspaoh) {
  return (
    bspaoh.destinationReceptionAcceptationStatus !==
    WasteAcceptationStatus.REFUSED
  );
}

function isDestinationSealed(
  val: ZodFullBspaoh,
  persistedBspaoh: PersistedBspaoh,
  userFunctions: UserFunctions
) {
  if (
    userFunctions.isEmitter &&
    val.transporterTransportSignatureDate === null
  ) {
    return false;
  }

  return true;
}

function isRefusedOrPartiallyRefused(bspaoh: ZodFullBspaoh) {
  return (
    !!bspaoh.destinationReceptionAcceptationStatus &&
    [
      WasteAcceptationStatus.REFUSED,
      WasteAcceptationStatus.PARTIALLY_REFUSED
    ].includes(bspaoh.destinationReceptionAcceptationStatus)
  );
}

function requireTransporterRecepisse(bspaoh: ZodFullBspaoh) {
  return (
    !bspaoh.transporterRecepisseIsExempted &&
    bspaoh.transporterTransportMode === "ROAD" &&
    !isForeignVat(bspaoh.transporterCompanyVatNumber)
  );
}

type CheckParams = {
  bspaoh: ZodFullBspaoh;
  persistedBspaoh: PersistedBspaoh;
  updatedFields: string[];
  userFunctions: UserFunctions;
  signaturesToCheck: BspaohSignatureType[];
};

export function getSealedFields({
  bspaoh,
  persistedBspaoh,
  userFunctions,
  signaturesToCheck
}: Omit<CheckParams, "updatedFields">) {
  return Object.entries(editionRules)
    .filter(
      ([_, rule]) =>
        signaturesToCheck.includes(rule.sealed.from) &&
        (!rule.sealed.when ||
          rule.sealed.when(bspaoh, persistedBspaoh, userFunctions))
    )
    .map(([field]) => field as keyof BspaohEditionRules);
}

function noop() {
  // do nothing, but do it well.
}

type GenRulesEntries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

type BspaohRulesEntries = GenRulesEntries<BspaohEditionRules>;

export function checkSealedAndRequiredFields(
  {
    bspaoh,
    persistedBspaoh,
    updatedFields,
    userFunctions,
    signaturesToCheck
  }: CheckParams,
  ctx: RefinementCtx
) {
  for (const [field, rule] of Object.entries(
    editionRules
  ) as BspaohRulesEntries) {
    // Apply default values to rules
    const sealedRule = {
      from: rule.sealed.from,
      when: rule.sealed.when ?? (() => true), // Default to true
      superRefine: rule.sealed.superRefine ?? noop, // Default to no-op
      suffix: rule.sealed.suffix
    };
    const requiredRule = {
      from: rule.required?.from ?? "NO_CHECK_RULE",
      when: rule.required?.when ?? (() => true), // Default to true
      superRefine: rule.required?.superRefine ?? noop, // Default to no-op
      suffix: rule.required?.suffix
    };

    const fieldDescription = rule.readableFieldName
      ? capitalize(rule.readableFieldName)
      : `Le champ ${field}`;

    const isSealed =
      signaturesToCheck.includes(sealedRule.from) &&
      sealedRule.when(bspaoh, persistedBspaoh, userFunctions);

    if (isSealed) {
      if (updatedFields.includes(field)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: rule.path ?? [field],
          message: [
            `${fieldDescription} a été verrouillé via signature et ne peut pas être modifié.`,
            sealedRule.suffix
          ]
            .filter(Boolean)
            .join(" ")
        });
      }
      // @ts-expect-error superRefineWhenSealed first param is inferred as never
      sealedRule.superRefine(bspaoh[field], ctx);
    }

    const isRequired =
      signaturesToCheck.includes(requiredRule.from) &&
      requiredRule.when(bspaoh, persistedBspaoh, userFunctions);

    if (isRequired) {
      if (bspaoh[field] == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: rule.path ?? [field],
          message: [`${fieldDescription} est obligatoire.`, requiredRule.suffix]
            .filter(Boolean)
            .join(" ")
        });
      }
      // @ts-expect-error superRefineWhenSealed first param is inferred as never
      requiredRule.superRefine(bspaoh[field], ctx);
    }
  }
}

export const getRequiredAndSealedFieldPaths = async (
  bspaoh: BspaohForParsing,
  currentSignatures: BspaohSignatureType[],
  nextSignature: BspaohSignatureType | undefined,
  user: User | undefined
): Promise<{
  requiredForNextSignature: string[];
  sealed: string[];
}> => {
  const nextSignatures = nextSignature
    ? currentSignatures.concat([nextSignature])
    : currentSignatures;
  const requiredFields: string[] = [];
  const sealedFields: string[] = [];
  const userFunctions = await getUserFunctions(user, bspaoh);
  for (const bspaohField of Object.keys(editionRules)) {
    const { required, sealed, path } =
      editionRules[bspaohField as keyof BspaohRulesEntries];
    // Apply default values to rules
    const sealedRule = {
      from: sealed?.from,
      when: sealed?.when ?? (() => true) // Default to true
    };
    const requiredRule = {
      from: required?.from ?? "NO_CHECK_RULE",
      when: required?.when ?? (() => true) // Default to true
    };
    if (path) {
      if (required) {
        const isRequired =
          nextSignatures.includes(requiredRule.from) &&
          requiredRule.when(bspaoh, bspaoh, userFunctions);
        if (isRequired) {
          requiredFields.push(path.join("."));
        }
      }
      if (sealed) {
        const isSealed =
          currentSignatures.includes(sealedRule.from) &&
          sealedRule.when(bspaoh, bspaoh, userFunctions);
        if (isSealed) {
          sealedFields.push(path.join("."));
        }
      }
    }
  }
  return {
    requiredForNextSignature: requiredFields,
    sealed: sealedFields
  };
};

/**
 * Util to print a digest of edition rules.
 * Must be called after initalization
 */
export function printVerboseRules() {
  for (const [k, v] of Object.entries(editionRules)) {
    console.log({
      "nom technique": k,
      "nom verbeux": v?.readableFieldName ?? "",
      "path gql": v?.path?.join("."),
      "requis à partir de": v?.required?.from ?? "",
      "condition requis": v?.required?.when?.toString() ?? "",
      "scellé à partir de": v?.sealed?.from ?? "",
      "condition scellé": v?.sealed?.when?.toString() ?? ""
    });
  }
}
