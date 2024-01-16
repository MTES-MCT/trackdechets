import { Prisma, WasteAcceptationStatus } from "@prisma/client";
import { RefinementCtx, z } from "zod";
import { BspaohSignatureType } from "../../generated/graphql/types";
import { capitalize } from "../../common/strings";
import { ZodFullBspaoh } from "./schema";
import { isForeignVat } from "@td/constants";
import { UnparsedInputs } from ".";
import { getUserFunctions, getSignatureAncestors } from "./helpers";

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

export type BspaohEditionRules = {
  [Key in keyof EditableFullBspaohFields]: {
    // At what signature the field is sealed, and under which circumstances
    sealed: FieldCheck<Key>;
    // At what signature the field is required, and under which circumstances. If absent, field is never required
    required?: FieldCheck<Key>;
    readableFieldName?: string; // A custom field name for errors
  };
};

export const editionRules: BspaohEditionRules = {
  wasteAdr: {
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" },
    readableFieldName: "le code adr"
  },
  wasteType: {
    readableFieldName: "le type de déchet",
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" }
  },
  wasteCode: {
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" },
    readableFieldName: "le code famille"
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
    }
  },
  emitterCompanyName: {
    readableFieldName: "le nom de l'entreprise émettrice",
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" }
  },
  emitterCompanySiret: {
    readableFieldName: "le SIRET de l'entreprise émettrice",
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" }
  },
  emitterCompanyAddress: {
    readableFieldName: "l'adresse de l'entreprise émettrice",
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" }
  },
  emitterCompanyContact: {
    readableFieldName: "le nom de contact de l'entreprise émettrice",
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" }
  },
  emitterCompanyPhone: {
    readableFieldName: "le téléphone de l'entreprise émettrice",
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" }
  },
  emitterCompanyMail: {
    readableFieldName: "l'email de l'entreprise émettrice",

    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" }
  },
  emitterCustomInfo: {
    readableFieldName:
      "les champs d'informations complémentaires de l'entreprise émettrice",
    sealed: { from: "EMISSION" }
  },
  emitterPickupSiteName: {
    readableFieldName: "le nom de l'adresse de chantier ou de collecte",
    sealed: { from: "EMISSION" }
  },
  emitterPickupSiteAddress: {
    readableFieldName: "l'adresse de collecte ou de chantier",
    sealed: { from: "EMISSION" }
  },
  emitterPickupSiteCity: {
    readableFieldName: "la ville de l'adresse de collecte ou de chantier",
    sealed: { from: "EMISSION" }
  },
  emitterPickupSitePostalCode: {
    readableFieldName: "le code postal de l'adresse de collecte ou de chantier",
    sealed: { from: "EMISSION" }
  },
  emitterPickupSiteInfos: {
    readableFieldName: "les informations de l'adresse de collecte",
    sealed: { from: "EMISSION" }
  },
  emitterWasteWeightValue: {
    readableFieldName: "le poids du déchet émis",
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION",
      when: bspaoh =>
        !bspaoh.emitterWasteQuantityValue ||
        !!bspaoh.emitterWasteWeightIsEstimate
    }
  },
  emitterWasteWeightIsEstimate: {
    readableFieldName: "la quantité émise (estimée ou non)",
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION",
      when: bspaoh => !!bspaoh.emitterWasteQuantityValue
    }
  },
  emitterWasteQuantityValue: {
    readableFieldName: "la quantité émise (nombre)",
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION",
      when: bspaoh => !bspaoh.emitterWasteWeightValue
    }
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
    sealed: {
      from: "EMISSION",
      when: isDestinationSealed
    },
    required: { from: "EMISSION" }
  },
  destinationCompanyPhone: {
    readableFieldName: "le téléphone de l'entreprise de destination",
    sealed: {
      from: "EMISSION",
      when: isDestinationSealed
    },
    required: { from: "EMISSION" }
  },
  destinationCompanyMail: {
    readableFieldName: "l'email de l'entreprise de destination",
    sealed: {
      from: "EMISSION",
      when: isDestinationSealed
    },
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
      from: "EMISSION"
    }
  },
  handedOverToDestinationDate: {
    readableFieldName: "la date de remise à l'entreprise de destination",
    sealed: { from: "DELIVERY" }
  },

  destinationReceptionWasteWeightValue: {
    readableFieldName: "le poids du déchet reçu",
    sealed: { from: "RECEPTION" },
    required: {
      from: "RECEPTION",
      when: bspaoh =>
        !bspaoh.destinationReceptionWasteQuantityValue ||
        !!bspaoh.destinationReceptionWasteWeightIsEstimate
    }
  },
  destinationReceptionWasteWeightIsEstimate: {
    readableFieldName: "la quantité reçue (estimée ou non)",
    sealed: { from: "RECEPTION" },
    required: {
      from: "RECEPTION",
      when: bspaoh => !!bspaoh.destinationReceptionWasteWeightValue
    }
  },
  destinationReceptionWasteQuantityValue: {
    readableFieldName: "la quantité remise (nombre)",
    sealed: {
      from: "RECEPTION",
      when: bspaoh => !!bspaoh.destinationReceptionWasteWeightValue
    }
  },

  destinationReceptionAcceptationStatus: {
    readableFieldName: "le champ d'acceptation du déchet",
    sealed: { from: "RECEPTION" },
    required: { from: "RECEPTION" }
  },
  destinationReceptionWasteRefusalReason: {
    readableFieldName: "la raison du refus",
    sealed: { from: "RECEPTION" },
    required: { from: "RECEPTION", when: isRefusedOrPartiallyRefused }
  },
  destinationReceptionDate: {
    readableFieldName: "la date de réception",
    sealed: { from: "RECEPTION" },
    required: { from: "RECEPTION" }
  },
  destinationReceptionWastePackagingsAcceptation: {
    readableFieldName: "le detail des conditionnements reçus",
    sealed: { from: "RECEPTION" },
    required: { from: "RECEPTION" }
  },
  destinationOperationCode: {
    readableFieldName: "le code d'opération de la destination",
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION" }
  },
  destinationOperationDate: {
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION", when: isNotRefused }
  },
  transporterCompanyName: {
    readableFieldName: "le nom du transporteur",
    sealed: { from: "TRANSPORT" },
    required: { from: "TRANSPORT" }
  },
  transporterCompanySiret: {
    readableFieldName: "le SIRET du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "EMISSION",
      when: bspaoh => !bspaoh.transporterCompanyVatNumber
    }
  },
  transporterTakenOverAt: {
    readableFieldName: "la date de prise en charge par le transporteur",
    sealed: { from: "TRANSPORT" },
    required: { from: "TRANSPORT" }
  },
  transporterCompanyAddress: {
    readableFieldName: "l'adresse du transporteur",
    sealed: { from: "TRANSPORT" },
    required: { from: "TRANSPORT" }
  },
  transporterCompanyContact: {
    readableFieldName: "le nom de contact du transporteur",
    sealed: { from: "TRANSPORT" },
    required: { from: "TRANSPORT" }
  },
  transporterCompanyPhone: {
    readableFieldName: "le téléphone du transporteur",
    sealed: { from: "TRANSPORT" },
    required: { from: "TRANSPORT" }
  },
  transporterCompanyMail: {
    readableFieldName: "l'email du transporteur",
    sealed: { from: "TRANSPORT" },
    required: { from: "TRANSPORT" }
  },
  transporterCompanyVatNumber: {
    readableFieldName: "le numéro de TVA du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: bspaoh => !bspaoh.transporterCompanySiret
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
    required: { from: "TRANSPORT" }
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
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT"
    },
    readableFieldName: "le mode de transport"
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
    }
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
          path: [field],
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
          path: [field],
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
/**
 * Util to print a digest of edition rules.
 * Must be called after initalization
 */
export function printVerboseRules() {
  for (const [k, v] of Object.entries(editionRules)) {
    console.log({
      "nom technique": k,
      "nom verbeux": v?.readableFieldName ?? "",
      "path gql": prismaFieldsToGqlPaths[k],
      "requis à partir de": v?.required?.from ?? "",
      "condition requis": v?.required?.when?.toString() ?? "",
      "scellé à partir de": v?.sealed?.from ?? "",
      "condition scellé": v?.sealed?.when?.toString() ?? ""
    });
  }
}

export function getSealedFieldsForSignature(signature?: BspaohSignatureType) {
  const res: string[] = [];
  if (!signature) {
    return res;
  }

  const ancestors = getSignatureAncestors(signature);

  for (const [k, v] of Object.entries(editionRules)) {
    if (ancestors.includes(v?.sealed?.from)) {
      res.push(k);
    }
  }
  return res;
}

/**
 * Transform a camel-cased string to a dotted path
 * emitterCompanySiret -> emitter.company.siret
 */
const prismaFieldToGqlPath = (field: string) => ({
  [field]: field
    .split(/(?=[A-Z])/)
    .map(el => el.toLowerCase())
    .join(".")
});

const CompanyFieldToGqlPath = prefix => ({
  ...prismaFieldToGqlPath(`${prefix}CompanyName`),
  ...prismaFieldToGqlPath(`${prefix}CompanySiret`),
  ...prismaFieldToGqlPath(`${prefix}CompanyName`),
  ...prismaFieldToGqlPath(`${prefix}CompanyAddress`),
  ...prismaFieldToGqlPath(`${prefix}CompanyContact`),
  ...prismaFieldToGqlPath(`${prefix}CompanyPhone`),
  ...prismaFieldToGqlPath(`${prefix}CompanyMail`)
});

/**
 * Map prisma fields to their gql input path.
 * Allows to configure frontend by setting which fields are sealed
 */
export const prismaFieldsToGqlPaths = {
  ...prismaFieldToGqlPath("wasteCode"),
  ...prismaFieldToGqlPath("wasteAdr"),
  ...prismaFieldToGqlPath("wasteType"),
  ...prismaFieldToGqlPath("wastePackagings"),

  ...CompanyFieldToGqlPath("emitter"),

  emitterCustomInfo: "emitter.customInfo",

  emitterPickupSiteName: "emitter.pickupSite.name",
  emitterPickupSiteAddress: "emitter.pickupSite.address",
  emitterPickupSiteCity: "emitter.pickupSite.city",
  emitterPickupSitePostalCode: "emitter.pickupSite.postalCode",
  emitterPickupSiteInfos: "emitter.pickupSite.infos",

  emitterWasteQuantityValue: "emitter.emission.detail.quantity",
  emitterWasteWeightValue: "emitter.emission.detail.weight.value",
  emitterWasteWeightIsEstimate: "emitter.emission.detail.weight.isEstimate",
  ...CompanyFieldToGqlPath("destination"),
  ...prismaFieldToGqlPath("destinationCap"),

  handedOverToDestinationDate: "destination.handedOverToDestination.date",
  ...prismaFieldToGqlPath("destinationReceptionAcceptationStatus"),
  destinationReceptionWasteRefusalReason: "destination.reception.refusalReason",

  ...prismaFieldToGqlPath("destinationReceptionWasteQuantityValue"),
  ...prismaFieldToGqlPath("destinationReceptionWasteWeightValue"),
  ...prismaFieldToGqlPath("destinationReceptionDate"),

  destinationReceptionWasteWeightValue:
    "destination.reception.detail.weight.value",
  destinationReceptionWasteWeightIsEstimate:
    "destination.reception.detail.weight.isEstimate",
  destinationReceptionWasteQuantityValue:
    "destination.reception.detail.quantity",

  destinationReceptionWastePackagingsAcceptation:
    "destination.reception.acceptation.packagings",

  ...prismaFieldToGqlPath("destinationOperationCode"),
  ...prismaFieldToGqlPath("destinationOperationDate"),

  ...prismaFieldToGqlPath("destinationCustomInfo"),

  ...CompanyFieldToGqlPath("transporter"),
  transporterCompanyVatNumber: "transporter.company.vatNumber",

  transporterRecepisseIsExempted: "transporter.recepisse.isExempted",
  ...prismaFieldToGqlPath("transporterRecepisseDepartment"),
  ...prismaFieldToGqlPath("transporterRecepisseNumber"),

  transporterRecepisseValidityLimit: "transporter.recepisse.validityLimit",
  ...prismaFieldToGqlPath("transporterTransportMode"),
  ...prismaFieldToGqlPath("transporterTransportPlates"),

  transporterTakenOverAt: "transporter.takenOverAt",
  ...prismaFieldToGqlPath("transporterCustomInfo")
};
