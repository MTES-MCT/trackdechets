import { BsdaType, Prisma, WasteAcceptationStatus } from "@prisma/client";
import { RefinementCtx, z } from "zod";
import { BsdaSignatureType } from "../../generated/graphql/types";
import { ZodBsda } from "./schema";
import { isForeignVat } from "../../common/constants/companySearchHelpers";
import { capitalize } from "../../common/strings";
import { getUserFunctions } from "./helpers";

export type EditableBsdaFields = Required<
  Omit<
    Prisma.BsdaCreateInput,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "isDraft"
    | "isDeleted"
    | "status"
    | "emitterEmissionSignatureDate"
    | "emitterEmissionSignatureAuthor"
    | "transporterTransportSignatureAuthor"
    | "transporterTransportSignatureDate"
    | "workerWorkSignatureAuthor"
    | "workerWorkSignatureDate"
    | "destinationOperationSignatureAuthor"
    | "destinationOperationSignatureDate"
    | "groupedInId"
    | "forwardingId"
    | "groupedIn"
    | "forwardedIn"
    | "BsdaRevisionRequest"
    | "intermediariesOrgIds"
  >
>;

export type CheckFn = (val: ZodBsda, userFunctions: UserFunctions) => boolean;
export type FieldCheck<Key extends keyof EditableBsdaFields> = {
  from: BsdaSignatureType;
  when?: CheckFn;
  superRefine?: (val: ZodBsda[Key], ctx: RefinementCtx) => void; // For state specific validation rules. eg array must have length > 0 when the field is required
  suffix?: string; // A custom message at the end of the error
};

export type EditionRules = {
  [Key in keyof EditableBsdaFields]: {
    // At what signature the field is sealed, and under which circumstances
    sealed: FieldCheck<Key>;
    // At what signature the field is required, and under which circumstances. If absent, field is never required
    required?: FieldCheck<Key>;
    readableFieldName?: string; // A custom field name for errors
  };
};

export const editionRules: EditionRules = {
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
    readableFieldName: "le contact de l'entreprise émettrice",
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION",
      when: bsda => !bsda.emitterIsPrivateIndividual
    }
  },
  emitterCompanyPhone: {
    readableFieldName: "le téléphone de l'entreprise émettrice",
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION",
      when: bsda => !bsda.emitterIsPrivateIndividual
    }
  },
  emitterCompanyMail: {
    readableFieldName: "l'email de l'entreprise émettrice",
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION",
      when: bsda => !bsda.emitterIsPrivateIndividual
    }
  },
  emitterCustomInfo: { sealed: { from: "EMISSION" } },
  emitterPickupSiteName: { sealed: { from: "EMISSION" } },
  emitterPickupSiteAddress: { sealed: { from: "EMISSION" } },
  emitterPickupSiteCity: { sealed: { from: "EMISSION" } },
  emitterPickupSitePostalCode: {
    sealed: { from: "EMISSION" }
  },
  emitterPickupSiteInfos: { sealed: { from: "EMISSION" } },
  ecoOrganismeName: {
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: bsda => !!bsda.ecoOrganismeSiret
    }
  },
  ecoOrganismeSiret: { sealed: { from: "TRANSPORT" } },
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
    readableFieldName: "le contact de l'entreprise de destination",
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
  destinationCustomInfo: { sealed: { from: "OPERATION" } },
  destinationCap: {
    readableFieldName: "le CAP du destinataire",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "EMISSION",
      when: bsda =>
        bsda.type !== BsdaType.COLLECTION_2710 &&
        !Boolean(bsda.destinationOperationNextDestinationCompanySiret)
    }
  },
  destinationPlannedOperationCode: {
    readableFieldName: "le code d'opération de la destination",
    sealed: { from: "TRANSPORT" },
    required: { from: "EMISSION" }
  },
  destinationReceptionDate: {
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION" }
  },
  destinationReceptionWeight: {
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION" }
  },
  destinationReceptionAcceptationStatus: {
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION" }
  },
  destinationReceptionRefusalReason: {
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION", when: isRefusedOrPartiallyRefused }
  },
  destinationOperationCode: {
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION", when: isNotRefused }
  },
  destinationOperationMode: {
    sealed: { from: "OPERATION" }
  },
  destinationOperationDescription: {
    sealed: { from: "OPERATION" }
  },
  destinationOperationDate: {
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
    readableFieldName: "le contact de l'exutoire",
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
    readableFieldName: "le code d'opétation de l'exutoire",
    sealed: { from: "OPERATION" },
    required: {
      from: "EMISSION",
      when: bsda =>
        Boolean(bsda.destinationOperationNextDestinationCompanySiret)
    }
  },
  transporterCompanyName: {
    sealed: { from: "TRANSPORT" },
    required: { from: "TRANSPORT", when: hasTransporter }
  },
  transporterCompanySiret: {
    readableFieldName: "le SIRET du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "EMISSION",
      when: bsda => {
        // Transporter is required if there is no worker and the emitter is a private individual.
        // This is to avoid usage of an OTHER_COLLECTIONS BSDA instead of a COLLECTION_2710
        if (
          bsda.emitterIsPrivateIndividual &&
          bsda.type === BsdaType.OTHER_COLLECTIONS &&
          bsda.workerIsDisabled &&
          !bsda.transporterCompanyVatNumber
        ) {
          return true;
        }

        // Otherwise, the transporter is only required for the transporter signature.
        // No specific check needed as anyway he cannot sign without being part of the bsda
        return false;
      },
      suffix:
        "Si l'émetteur est un particulier et qu'aucune entreprise de travaux n'a été visée, l'ajout d'un transporteur est obligatoire."
    }
  },
  transporterCompanyAddress: {
    readableFieldName: "l'adresse du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: hasTransporter
    }
  },
  transporterCompanyContact: {
    readableFieldName: "le contact du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: hasTransporter
    }
  },
  transporterCompanyPhone: {
    readableFieldName: "le téléphone du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: hasTransporter
    }
  },
  transporterCompanyMail: {
    readableFieldName: "l'email du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: hasTransporter
    }
  },
  transporterCompanyVatNumber: {
    readableFieldName: "le numéro de TVA du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "EMISSION",
      when: bsda => {
        // Transporter is required if there is no worker and the emitter is a private individual.
        // This is to avoid usage of an OTHER_COLLECTIONS BSDA instead of a COLLECTION_2710
        if (
          bsda.emitterIsPrivateIndividual &&
          bsda.type === BsdaType.OTHER_COLLECTIONS &&
          bsda.workerIsDisabled &&
          !bsda.transporterCompanySiret
        ) {
          return true;
        }

        return false;
      }
    }
  },
  transporterCustomInfo: { sealed: { from: "TRANSPORT" } },
  transporterRecepisseIsExempted: {
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: hasTransporter
    }
  },
  transporterRecepisseNumber: {
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: bsda =>
        hasTransporter(bsda) &&
        !bsda.transporterRecepisseIsExempted &&
        !isForeignVat(bsda.transporterCompanyVatNumber),
      suffix: "L'établissement doit renseigner son récépissé dans Trackdéchets"
    },
    readableFieldName: "Transporteur: le numéro de récépissé"
  },
  transporterRecepisseDepartment: {
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: bsda =>
        hasTransporter(bsda) &&
        !bsda.transporterRecepisseIsExempted &&
        !isForeignVat(bsda.transporterCompanyVatNumber),
      suffix: "L'établissement doit renseigner son récépissé dans Trackdéchets"
    },
    readableFieldName: "Transporteur: le département de récépissé"
  },
  transporterRecepisseValidityLimit: {
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: bsda =>
        hasTransporter(bsda) &&
        !bsda.transporterRecepisseIsExempted &&
        !isForeignVat(bsda.transporterCompanyVatNumber),
      suffix: "L'établissement doit renseigner son récépissé dans Trackdéchets"
    },
    readableFieldName: "Transporteur: la date de validité du récépissé"
  },
  transporterTransportMode: {
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: hasTransporter
    },
    readableFieldName: "le mode de transport"
  },
  transporterTransportPlates: {
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: bsda =>
        hasTransporter(bsda) && bsda.transporterTransportMode === "ROAD",
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
  },
  transporterTransportTakenOverAt: {
    sealed: { from: "TRANSPORT" }
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
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerCompanySiret: {
    readableFieldName: "le SIRET de l'entreprise de travaux",
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerCompanyAddress: {
    readableFieldName: "l'adresse de l'entreprise de travaux",
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerCompanyContact: {
    readableFieldName: "le contact de l'entreprise de travaux",
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerCompanyPhone: {
    readableFieldName: "le téléphone de l'entreprise de travaux",
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerCompanyMail: {
    readableFieldName: "l'email de l'entreprise de travaux",
    sealed: { from: "EMISSION" },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerWorkHasEmitterPaperSignature: {
    sealed: { from: "WORK" }
  },
  workerCertificationHasSubSectionFour: {
    sealed: { from: "WORK" }
  },
  workerCertificationHasSubSectionThree: {
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
    sealed: { from: "WORK" },
    required: {
      from: "WORK",
      when: bsda => Boolean(bsda.workerCertificationHasSubSectionThree)
    }
  },
  workerCertificationOrganisation: {
    sealed: { from: "WORK" },
    required: {
      from: "WORK",
      when: bsda => Boolean(bsda.workerCertificationHasSubSectionThree)
    }
  },
  brokerCompanyName: { sealed: { from: "EMISSION" } },
  brokerCompanySiret: { sealed: { from: "EMISSION" } },
  brokerCompanyAddress: { sealed: { from: "EMISSION" } },
  brokerCompanyContact: { sealed: { from: "EMISSION" } },
  brokerCompanyPhone: { sealed: { from: "EMISSION" } },
  brokerCompanyMail: { sealed: { from: "EMISSION" } },
  brokerRecepisseNumber: { sealed: { from: "EMISSION" } },
  brokerRecepisseDepartment: {
    sealed: { from: "EMISSION" }
  },
  brokerRecepisseValidityLimit: {
    sealed: { from: "EMISSION" }
  },
  wasteCode: {
    sealed: { from: "EMISSION" },
    required: { from: "EMISSION" },
    readableFieldName: "le code déchet"
  },
  wasteAdr: { sealed: { from: "WORK" } },
  wasteFamilyCode: {
    sealed: { from: "WORK" },
    required: { from: "WORK" },
    readableFieldName: "le code famille"
  },
  wasteMaterialName: { sealed: { from: "WORK" }, required: { from: "WORK" } },
  wasteConsistence: {
    sealed: { from: "WORK" },
    required: { from: "WORK" },
    readableFieldName: "la consistance"
  },
  wasteSealNumbers: { sealed: { from: "WORK" }, required: { from: "WORK" } },
  wastePop: { sealed: { from: "WORK" }, required: { from: "WORK" } },
  packagings: {
    sealed: { from: "WORK" },
    required: {
      from: "WORK",
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
    readableFieldName: "le conditionnement"
  },
  weightIsEstimate: { sealed: { from: "WORK" }, required: { from: "WORK" } },
  weightValue: { sealed: { from: "WORK" }, required: { from: "WORK" } },
  grouping: { sealed: { from: "EMISSION" } },
  forwarding: { sealed: { from: "EMISSION" } },
  intermediaries: { sealed: { from: "TRANSPORT" } }
};

function hasWorker(bsda: ZodBsda) {
  return bsda.type === BsdaType.OTHER_COLLECTIONS && !bsda.workerIsDisabled;
}

function hasTransporter(bsda: ZodBsda) {
  return bsda.type !== BsdaType.COLLECTION_2710;
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

function isDestinationSealed(val: ZodBsda, userFunctions: UserFunctions) {
  const isSealedForEmitter = hasWorker(val)
    ? val.workerWorkSignatureDate != null
    : val.transporterTransportSignatureDate != null;

  if (userFunctions.isEmitter && !isSealedForEmitter) {
    return false;
  }

  // If I am worker, transporter or destination
  // and the transporter hasn't signed
  // and I am adding a nextDestinationCompanySiret,
  // then I can edit the destination.
  if (
    (userFunctions.isEmitter ||
      userFunctions.isWorker ||
      userFunctions.isTransporter ||
      userFunctions.isDestination) &&
    val.transporterTransportSignatureDate == null &&
    val.destinationOperationNextDestinationCompanySiret
  ) {
    return false;
  }

  return true;
}

function noop() {
  // do nothing.
}

type UserFunctions = Awaited<ReturnType<typeof getUserFunctions>>;
type CheckParams = {
  bsda: ZodBsda;
  updatedFields: string[];
  userFunctions: UserFunctions;
  signaturesToCheck: BsdaSignatureType[];
};

type RulesEntries = {
  [K in keyof EditionRules]: [K, EditionRules[K]];
}[keyof EditionRules][];

export function checkSealedAndRequiredFields(
  { bsda, updatedFields, userFunctions, signaturesToCheck }: CheckParams,
  ctx: RefinementCtx
) {
  for (const [field, rule] of Object.entries(editionRules) as RulesEntries) {
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
      sealedRule.when(bsda, userFunctions);
    if (isSealed) {
      if (updatedFields.includes(field)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: [
            `${fieldDescription} a été vérouillé via signature et ne peut pas être modifié.`,
            sealedRule.suffix
          ]
            .filter(Boolean)
            .join(" ")
        });
      }
      // @ts-expect-error TODO: superRefineWhenSealed first param is inferred as never ?
      sealedRule.superRefine(bsda[field], ctx);
    }

    const isRequired =
      signaturesToCheck.includes(requiredRule.from) &&
      requiredRule.when(bsda, userFunctions);
    if (isRequired) {
      if (bsda[field] == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: [`${fieldDescription} est obligatoire.`, requiredRule.suffix]
            .filter(Boolean)
            .join(" ")
        });
      }
      // @ts-expect-error TODO: superRefineWhenSealed first param is inferred as never ?
      requiredRule.superRefine(bsda[field], ctx);
    }
  }
}

export function getSealedFields({
  bsda,
  userFunctions,
  signaturesToCheck
}: Omit<CheckParams, "updatedFields">) {
  return Object.entries(editionRules)
    .filter(
      ([_, rule]) =>
        signaturesToCheck.includes(rule.sealed.from) &&
        (!rule.sealed.when || rule.sealed.when(bsda, userFunctions))
    )
    .map(([field]) => field as keyof EditionRules);
}
