import { User } from "@prisma/client";
import { objectDiff } from "../../forms/workflow/diff";
import {
  BsdaInput,
  BsdaPackaging,
  BsdaSignatureType
} from "../../generated/graphql/types";
import { flattenBsdaInput, flattenBsdaTransporterInput } from "../converter";
import { SIGNATURES_HIERARCHY } from "./constants";
import { getUserCompanies } from "../../users/database";
import {
  ZodBsda,
  ZodOperationEnum,
  ZodWasteCodeEnum,
  ZodWorkerCertificationOrganismEnum
} from "./schema";
import { PrismaBsdaForParsing } from "./types";
import { safeInput } from "../../common/converter";

/**
 * Cette fonction permet de convertir les données d'input GraphQL
 * vers le format attendu par le parsing Zod. Certains champs sont
 * typés en string côté GraphQL mais en enum côté Zod ce qui nous oblige
 * à faire un casting de type.
 */
export function graphQlInputToZodBsda(input: BsdaInput): ZodBsda {
  const {
    wasteCode,
    destinationPlannedOperationCode,
    destinationOperationCode,
    workerCertificationOrganisation,
    intermediaries,
    ...flattenedBsdaInput
  } = flattenBsdaInput(input);
  const flattenedBsdaTransporter = flattenBsdaTransporterInput(input);

  return safeInput({
    ...flattenedBsdaInput,
    ...flattenedBsdaTransporter,
    wasteCode: wasteCode as ZodWasteCodeEnum,
    destinationPlannedOperationCode:
      destinationPlannedOperationCode as ZodOperationEnum,
    destinationOperationCode: destinationOperationCode as ZodOperationEnum,
    workerCertificationOrganisation:
      workerCertificationOrganisation as ZodWorkerCertificationOrganismEnum,
    intermediaries: intermediaries?.map(i =>
      safeInput({
        // FIXME : Les règles d'édition (fichier rules.ts) ne permettent
        // pas à ce jour de définir les règles de champ requis pour les intermédiaire.
        // Le schéma zod des intermédiaires enforce donc des champs requis dès le début
        // (contrairement aux autres champs du BSDA), ce qui est incohérent avec le typage
        // côté input GraphQL. On force donc le typage ici, quitte à lever des erreurs
        // de validation Zod dans le process de parsing.
        siret: i.siret!,
        vatNumber: i.vatNumber,
        address: i.address!,
        name: i.name!,
        contact: i.contact!,
        phone: i.phone,
        mail: i.mail
      })
    )
  });
}

/**
 * Cette fonction permet de convertir les données prisma
 * vers le format attendu par le parsing Zod. Certains champs sont
 * typés en string côté Prisma mais en enum côté Zod ce qui nous oblige
 * à faire un casting de type.
 */
export function prismaToZodBsda(bsda: PrismaBsdaForParsing): ZodBsda {
  const {
    createdAt,
    updatedAt,
    rowNumber,
    transporters,
    wasteCode,
    destinationPlannedOperationCode,
    destinationOperationCode,
    workerCertificationOrganisation,
    packagings,
    grouping,
    forwardingId,
    intermediaries,
    ...data
  } = bsda;
  const { id, ...transporter } = transporters[0];

  return {
    ...data,
    ...transporter,
    transporterId: id,
    wasteCode: wasteCode as ZodWasteCodeEnum,
    destinationPlannedOperationCode:
      destinationPlannedOperationCode as ZodOperationEnum,
    destinationOperationCode: destinationOperationCode as ZodOperationEnum,
    workerCertificationOrganisation:
      workerCertificationOrganisation as ZodWorkerCertificationOrganismEnum,
    packagings: packagings as BsdaPackaging[],
    grouping: grouping.map(bsda => bsda.id),
    forwarding: forwardingId,
    intermediaries: intermediaries.map(i => {
      const { bsdaId, id, createdAt, ...intermediaryData } = i;
      return { ...intermediaryData, address: intermediaryData.address! };
    })
  };
}

export function getUpdatedFields(bsda: ZodBsda, update: ZodBsda) {
  // only pick keys present in the input to compute the diff between
  // the input and the data in DB
  const compareTo = {
    ...Object.keys(update).reduce((acc, field) => {
      return { ...acc, [field]: bsda[field] };
    }, {})
  };

  const diff = objectDiff(update, compareTo);

  return Object.keys(diff);
}

/**
 * Gets all the signatures prior to the target signature in the signature hierarchy.
 */
export function getSignatureAncestors(
  targetSignature: BsdaSignatureType | undefined | null
): BsdaSignatureType[] {
  if (!targetSignature) return [];

  const parent = Object.entries(SIGNATURES_HIERARCHY).find(
    ([_, details]) => details.next === targetSignature
  )?.[0];

  return [
    targetSignature,
    ...getSignatureAncestors(parent as BsdaSignatureType)
  ];
}

export type BsdaUserFunctions = {
  isEcoOrganisme: boolean;
  isBroker: boolean;
  isWorker: boolean;
  isEmitter: boolean;
  isDestination: boolean;
  isTransporter: boolean;
};

export async function getBsdaUserFunctions(
  user: User | undefined,
  bsda: ZodBsda
): Promise<BsdaUserFunctions> {
  const companies = user ? await getUserCompanies(user.id) : [];
  const orgIds = companies.map(c => c.orgId);

  return {
    isEcoOrganisme:
      bsda.ecoOrganismeSiret != null && orgIds.includes(bsda.ecoOrganismeSiret),
    isBroker:
      bsda.brokerCompanySiret != null &&
      orgIds.includes(bsda.brokerCompanySiret),
    isWorker:
      bsda.workerCompanySiret != null &&
      orgIds.includes(bsda.workerCompanySiret),
    isEmitter:
      bsda.emitterCompanySiret != null &&
      orgIds.includes(bsda.emitterCompanySiret),
    isDestination:
      bsda.destinationCompanySiret != null &&
      orgIds.includes(bsda.destinationCompanySiret),
    isTransporter:
      (bsda.transporterCompanySiret != null &&
        orgIds.includes(bsda.transporterCompanySiret)) ||
      (bsda.transporterCompanyVatNumber != null &&
        orgIds.includes(bsda.transporterCompanyVatNumber))
  };
}

/**
 * Renvoie la dernière signature en date sur un BSDA
 */
export function getCurrentSignatureType(
  bsda: ZodBsda
): BsdaSignatureType | undefined {
  /**
   * Fonction interne récursive qui parcourt la hiérarchie des signatures et
   * renvoie les signatures présentes sur le bordereau
   */
  function getSignatures(current: BsdaSignatureType, acc: BsdaSignatureType[]) {
    const signature = SIGNATURES_HIERARCHY[current];
    const hasCurrentSignature = Boolean(bsda[signature.field]);
    const signatures = [...(hasCurrentSignature ? [current] : []), ...acc];
    if (signature.next) {
      return getSignatures(signature.next, signatures);
    }
    return signatures;
  }
  const signatures = getSignatures("EMISSION", []);

  if (signatures.length > 0) {
    return signatures[0];
  }

  return undefined;
}
