import {
  BsdaType,
  TransportMode,
  WasteAcceptationStatus
} from "@prisma/client";
import { RefinementCtx, z } from "zod";
import { BsdaSignatureType } from "../../generated/graphql/types";
import { ZodBsda } from "./schema";
import { isForeignVat } from "@td/constants";
import { capitalize } from "../../common/strings";
import { getUserFunctions } from "./helpers";
import { getOperationModesFromOperationCode } from "../../common/operationModes";
import { UnparsedInputs } from ".";

export type EditableBsdaFields = Required<
  Omit<
    ZodBsda,
    | "id"
    | "isDraft"
    | "isDeleted"
    | "emitterEmissionSignatureAuthor"
    | "emitterEmissionSignatureDate"
    | "destinationOperationSignatureAuthor"
    | "destinationOperationSignatureDate"
    | "transporterTransportSignatureAuthor"
    | "transporterTransportSignatureDate"
    | "workerWorkSignatureAuthor"
    | "workerWorkSignatureDate"
    | "intermediariesOrgIds"
    | "transportersOrgIds"
    | "transporterId"
  >
>;

type PersistedBsda = Pick<UnparsedInputs, "persisted">["persisted"];
export type CheckFn = (
  val: ZodBsda,
  persistedBsda: PersistedBsda,
  userFunctions: UserFunctions
) => boolean;

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
    readableFieldName: "le nom de contact de l'entreprise émettrice",
    sealed: { from: "EMISSION", when: isSealedForEmitter },
    required: {
      from: "EMISSION",
      when: bsda => !bsda.emitterIsPrivateIndividual
    }
  },
  emitterCompanyPhone: {
    readableFieldName: "le téléphone de l'entreprise émettrice",
    sealed: { from: "EMISSION", when: isSealedForEmitter },
    required: {
      from: "EMISSION",
      when: bsda => !bsda.emitterIsPrivateIndividual
    }
  },
  emitterCompanyMail: {
    readableFieldName: "l'email de l'entreprise émettrice",
    sealed: { from: "EMISSION", when: isSealedForEmitter },
    required: {
      from: "EMISSION",
      when: bsda => !bsda.emitterIsPrivateIndividual
    }
  },
  emitterCustomInfo: {
    readableFieldName:
      "les champs d'informations complémentaires de l'entreprise émettrice",
    sealed: { from: "EMISSION", when: isSealedForEmitter }
  },
  emitterPickupSiteName: {
    readableFieldName: "le nom de l'adresse de chantier ou de collecte",
    sealed: { from: "EMISSION", when: isSealedForEmitter }
  },
  emitterPickupSiteAddress: {
    readableFieldName: "l'adresse de collecte ou de chantier",
    sealed: { from: "EMISSION", when: isSealedForEmitter }
  },
  emitterPickupSiteCity: {
    readableFieldName: "la ville de l'adresse de collecte ou de chantier",
    sealed: { from: "EMISSION", when: isSealedForEmitter }
  },
  emitterPickupSitePostalCode: {
    readableFieldName: "le code postal de l'adresse de collecte ou de chantier",
    sealed: { from: "EMISSION", when: isSealedForEmitter }
  },
  emitterPickupSiteInfos: {
    readableFieldName: "les informations de l'adresse de collecte",
    sealed: { from: "EMISSION", when: isSealedForEmitter }
  },
  ecoOrganismeName: {
    readableFieldName: "le nom de l'éco-organisme",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: bsda => !!bsda.ecoOrganismeSiret
    }
  },
  ecoOrganismeSiret: {
    readableFieldName: "le SIRET de l'éco-organisme",
    sealed: { from: "TRANSPORT" }
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
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION" }
  },
  destinationCompanyPhone: {
    readableFieldName: "le téléphone de l'entreprise de destination",
    sealed: { from: "OPERATION" },
    required: { from: "EMISSION" }
  },
  destinationCompanyMail: {
    readableFieldName: "l'email de l'entreprise de destination",
    sealed: { from: "OPERATION" },
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
      from: "EMISSION",
      when: bsda =>
        bsda.type !== BsdaType.COLLECTION_2710 &&
        !Boolean(bsda.destinationOperationNextDestinationCompanySiret)
    }
  },
  destinationPlannedOperationCode: {
    readableFieldName: "le code d'opération prévu",
    sealed: { from: "TRANSPORT" },
    required: { from: "EMISSION" }
  },
  destinationReceptionDate: {
    readableFieldName: "la date de réception",
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION" }
  },
  destinationReceptionWeight: {
    readableFieldName: "le poids du déchet",
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION" }
  },
  destinationReceptionAcceptationStatus: {
    readableFieldName: "l'acceptation du déchet",
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION" }
  },
  destinationReceptionRefusalReason: {
    readableFieldName: "la raison du refus du déchet",
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION", when: isRefusedOrPartiallyRefused }
  },
  destinationOperationCode: {
    readableFieldName: "le code d'opération réalisé",
    sealed: { from: "OPERATION" },
    required: { from: "OPERATION", when: isNotRefused }
  },
  destinationOperationMode: {
    readableFieldName: "le mode de traitement",
    sealed: { from: "OPERATION" },
    required: {
      from: "OPERATION",
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
    readableFieldName: "la description de l'opération réalisée",
    sealed: { from: "OPERATION" }
  },
  destinationOperationDate: {
    readableFieldName: "la date de l'opération",
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
    readableFieldName: "le numéro de TVA de l'exutoire",
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
    readableFieldName: "le nom de contact de l'exutoire",
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
    readableFieldName: "le code d'opération de l'exutoire",
    sealed: { from: "OPERATION" },
    required: {
      from: "EMISSION",
      when: bsda =>
        Boolean(bsda.destinationOperationNextDestinationCompanySiret)
    }
  },
  transporterCompanyName: {
    readableFieldName: "le nom du transporteur",
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
    readableFieldName: "le nom de contact du transporteur",
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
  transporterCustomInfo: {
    readableFieldName:
      "les champs d'informations complémentaires du transporteur",
    sealed: { from: "TRANSPORT" }
  },
  transporterRecepisseIsExempted: {
    readableFieldName: "l'exemption de récépissé du transporteur",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: hasTransporter
    }
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
    readableFieldName: "le mode de transport",
    sealed: { from: "TRANSPORT" },
    required: {
      from: "TRANSPORT",
      when: hasTransporter
    }
  },
  transporterTransportPlates: {
    readableFieldName: "l'immatriculation du transporteur",
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
    readableFieldName: "la date d'enlèvement du transporteur",
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
    sealed: { from: "EMISSION", when: isSealedForEmitter },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerCompanySiret: {
    readableFieldName: "le SIRET de l'entreprise de travaux",
    sealed: { from: "EMISSION", when: isSealedForEmitter },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerCompanyAddress: {
    readableFieldName: "l'adresse de l'entreprise de travaux",
    sealed: { from: "EMISSION", when: isSealedForEmitter },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerCompanyContact: {
    readableFieldName: "le nom de contact de l'entreprise de travaux",
    sealed: { from: "WORK" },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerCompanyPhone: {
    readableFieldName: "le téléphone de l'entreprise de travaux",
    sealed: { from: "WORK" },
    required: {
      from: "EMISSION",
      when: hasWorker
    }
  },
  workerCompanyMail: {
    readableFieldName: "l'email de l'entreprise de travaux",
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
    readableFieldName: "travaux relevant de la sous-section 4",
    sealed: { from: "WORK" }
  },
  workerCertificationHasSubSectionThree: {
    readableFieldName: "travaux relevant de la sous-section 3",
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
    readableFieldName:
      "la date de validité de la certification de l'entreprise de travaux",
    sealed: { from: "WORK" },
    required: {
      from: "WORK",
      when: bsda => Boolean(bsda.workerCertificationHasSubSectionThree)
    }
  },
  workerCertificationOrganisation: {
    readableFieldName:
      "l'organisme de la certification de l'entreprise de travaux",
    sealed: { from: "WORK" },
    required: {
      from: "WORK",
      when: bsda => Boolean(bsda.workerCertificationHasSubSectionThree)
    }
  },
  brokerCompanyName: {
    readableFieldName: "le nom du courtier",
    sealed: { from: "OPERATION" }
  },
  brokerCompanySiret: {
    readableFieldName: "le SIRET du courtier",
    sealed: { from: "OPERATION" }
  },
  brokerCompanyAddress: {
    readableFieldName: "l'adresse du courtier",
    sealed: { from: "OPERATION" }
  },
  brokerCompanyContact: {
    readableFieldName: "le nom de contact du courtier",
    sealed: { from: "OPERATION" }
  },
  brokerCompanyPhone: {
    readableFieldName: "le téléphone du courtier",
    sealed: { from: "OPERATION" }
  },
  brokerCompanyMail: {
    readableFieldName: "le mail du courtier",
    sealed: { from: "OPERATION" }
  },
  brokerRecepisseNumber: {
    readableFieldName: "le numéro de récépissé du courtier",
    sealed: { from: "OPERATION" }
  },
  brokerRecepisseDepartment: {
    readableFieldName: "le département du récépissé du courtier",
    sealed: { from: "OPERATION" }
  },
  brokerRecepisseValidityLimit: {
    readableFieldName:
      "la date de validité de la certification de l'entreprise de travaux",
    sealed: { from: "OPERATION" }
  },
  wasteCode: {
    sealed: { from: "EMISSION", when: isSealedForEmitter },
    required: { from: "EMISSION" },
    readableFieldName: "le code déchet"
  },
  wasteAdr: { readableFieldName: "la mention ADR", sealed: { from: "WORK" } },
  wasteFamilyCode: {
    sealed: { from: "WORK" },
    required: { from: "WORK" },
    readableFieldName: "le code famille"
  },
  wasteMaterialName: {
    readableFieldName: "le nom de matériau",
    sealed: { from: "WORK" },
    required: { from: "WORK" }
  },
  wasteConsistence: {
    sealed: { from: "WORK" },
    required: { from: "WORK" },
    readableFieldName: "la consistance"
  },
  wasteSealNumbers: {
    readableFieldName: "le(s) numéro(s) de scellés",
    sealed: { from: "WORK" },
    required: { from: "WORK" }
  },
  wastePop: {
    readableFieldName: "le champ sur les polluants organiques persistants",
    sealed: { from: "WORK" },
    required: { from: "WORK" }
  },
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
  weightIsEstimate: {
    readableFieldName: "le champ pour indiquer sile poids est estimé",
    sealed: { from: "WORK" },
    required: { from: "WORK" }
  },
  weightValue: {
    readableFieldName: "le poids",
    sealed: { from: "WORK" },
    required: { from: "WORK" }
  },
  grouping: { sealed: { from: "EMISSION" } },
  forwarding: { sealed: { from: "EMISSION" } },
  intermediaries: {
    readableFieldName: "les intermédiaires",
    sealed: { from: "TRANSPORT" }
  }
};

function hasWorker(bsda: ZodBsda) {
  return bsda.type === BsdaType.OTHER_COLLECTIONS && !bsda.workerIsDisabled;
}

function hasTransporter(bsda: ZodBsda) {
  return bsda.type !== BsdaType.COLLECTION_2710;
}

function requireTransporterRecepisse(bsda: ZodBsda) {
  return (
    hasTransporter(bsda) &&
    !bsda.transporterRecepisseIsExempted &&
    bsda.transporterTransportMode === TransportMode.ROAD &&
    !isForeignVat(bsda.transporterCompanyVatNumber)
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

/**
 * The emitter has special rights to edit several fields after he signed,
 * and until other signatures are applied.
 */
function isSealedForEmitter(
  val: ZodBsda,
  persistedBsda: PersistedBsda,
  userFunctions: UserFunctions
) {
  const isSealedForEmitter = hasWorker(val)
    ? val.workerWorkSignatureDate != null
    : val.transporterTransportSignatureDate != null;

  if (userFunctions.isEmitter && !isSealedForEmitter) {
    return false;
  }

  return true;
}

function isDestinationSealed(
  val: ZodBsda,
  persistedBsda: PersistedBsda,
  userFunctions: UserFunctions
) {
  if (!isSealedForEmitter(val, persistedBsda, userFunctions)) {
    return false;
  }

  // If I am worker, transporter or destination and the transporter hasn't signed,
  // then I can either add or remove a nextDestination. To do so I need to edit the destination.
  const isAddingNextDestination =
    !persistedBsda?.destinationOperationNextDestinationCompanySiret &&
    val.destinationOperationNextDestinationCompanySiret;
  const isRemovingNextDestination =
    persistedBsda?.destinationOperationNextDestinationCompanySiret &&
    !val.destinationOperationNextDestinationCompanySiret;
  if (
    (userFunctions.isEmitter ||
      userFunctions.isWorker ||
      userFunctions.isTransporter ||
      userFunctions.isDestination) &&
    val.transporterTransportSignatureDate == null &&
    (isAddingNextDestination || isRemovingNextDestination)
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
  persistedBsda: PersistedBsda;
  updatedFields: string[];
  userFunctions: UserFunctions;
  signaturesToCheck: BsdaSignatureType[];
};

type RulesEntries = {
  [K in keyof EditionRules]: [K, EditionRules[K]];
}[keyof EditionRules][];

export function checkSealedAndRequiredFields(
  {
    bsda,
    persistedBsda,
    updatedFields,
    userFunctions,
    signaturesToCheck
  }: CheckParams,
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
      sealedRule.when(bsda, persistedBsda, userFunctions);
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
      requiredRule.when(bsda, persistedBsda, userFunctions);
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
  persistedBsda,
  userFunctions,
  signaturesToCheck
}: Omit<CheckParams, "updatedFields">) {
  return Object.entries(editionRules)
    .filter(
      ([_, rule]) =>
        signaturesToCheck.includes(rule.sealed.from) &&
        (!rule.sealed.when ||
          rule.sealed.when(bsda, persistedBsda, userFunctions))
    )
    .map(([field]) => field as keyof EditionRules);
}
