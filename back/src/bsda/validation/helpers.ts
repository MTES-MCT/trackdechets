import { User } from "@prisma/client";
import { objectDiff } from "../../forms/workflow/diff";
import type {
  BsdaInput,
  BsdaPackaging,
  BsdaTransporterInput
} from "@td/codegen-back";
import { flattenBsdaInput, flattenBsdaTransporterInput } from "../converter";
import { SIGNATURES_HIERARCHY } from "./constants";
import { AllBsdaSignatureType } from "../types";
import { getUserCompanies } from "../../users/database";
import {
  ZodBsda,
  ZodBsdaTransporter,
  ZodOperationEnum,
  ZodWasteCodeEnum,
  ZodWorkerCertificationOrganismEnum
} from "./schema";
import { PrismaBsdaForParsing } from "./types";
import { safeInput } from "../../common/converter";
import { prisma } from "@td/prisma";
import { UserInputError } from "../../common/errors";
import { getTransportersSync } from "../database";

export function graphqlInputToZodBsdaTransporter(
  input: BsdaTransporterInput
): ZodBsdaTransporter {
  return flattenBsdaTransporterInput(input);
}

export async function getZodTransporters(
  input: BsdaInput
): Promise<ZodBsdaTransporter[] | undefined> {
  if (input.transporter !== undefined && input.transporters) {
    throw new UserInputError(
      "Vous ne pouvez pas utiliser les champs `transporter` et `transporters` en même temps"
    );
  }
  if (input.transporter) {
    // Couche de compatibilité avec l'API BSDA "pré multi-modal"
    // Les données de `input.transporter` correspondent au premier
    // transporteur.
    return [graphqlInputToZodBsdaTransporter(input.transporter)];
  } else if (
    input.transporter === null ||
    (input.transporters && input.transporters.length === 0)
  ) {
    return [];
  } else if (input.transporters && input.transporters.length) {
    const dbTransporters = await prisma.bsdaTransporter.findMany({
      where: { id: { in: input.transporters } }
    });
    // Vérifie que tous les identifiants correspondent bien à un transporteur BSDA en base
    const unknownTransporters = input.transporters.filter(
      id => !dbTransporters.map(t => t.id).includes(id)
    );
    if (unknownTransporters.length > 0) {
      throw new UserInputError(
        `Aucun transporteur ne possède le ou les identifiants suivants : ${unknownTransporters.join(
          ", "
        )}`
      );
    }

    // garde le même ordre
    return input.transporters.map(transporterId => {
      const { createdAt, updatedAt, number, ...transporterData } =
        dbTransporters.find(t => t.id === transporterId)!;
      return transporterData;
    });
  }

  return undefined;
}

/**
 * Cette fonction permet de convertir les données d'input GraphQL
 * vers le format attendu par le parsing Zod. Certains champs sont
 * typés en string côté GraphQL mais en enum côté Zod ce qui nous oblige
 * à faire un casting de type.
 */
export async function graphQlInputToZodBsda(
  input: BsdaInput
): Promise<ZodBsda> {
  const {
    wasteCode,
    destinationPlannedOperationCode,
    destinationOperationCode,
    workerCertificationOrganisation,
    intermediaries,
    ...flattenedBsdaInput
  } = flattenBsdaInput(input);

  const transporters = await getZodTransporters(input);

  return safeInput({
    ...flattenedBsdaInput,
    wasteCode: wasteCode as ZodWasteCodeEnum,
    destinationPlannedOperationCode:
      destinationPlannedOperationCode as ZodOperationEnum,
    destinationOperationCode: destinationOperationCode as ZodOperationEnum,
    workerCertificationOrganisation:
      workerCertificationOrganisation as ZodWorkerCertificationOrganismEnum,
    transporters,
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

  return {
    ...data,
    weightValue: data.weightValue?.toNumber(),
    destinationReceptionWeight: data.destinationReceptionWeight?.toNumber(),
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
    }),
    transporters: getTransportersSync({ transporters }).map(t => {
      const { createdAt, updatedAt, number, ...transporterData } = t;
      return transporterData;
    })
  };
}

export function getUpdatedFields<T extends ZodBsda | ZodBsdaTransporter>(
  val: T,
  update: T
): string[] {
  // only pick keys present in the input to compute the diff between
  // the input and the data in DB
  const compareTo = {
    ...Object.keys(update).reduce((acc, field) => {
      return { ...acc, [field]: val[field] };
    }, {})
  };

  const diff = objectDiff(update, compareTo);

  return Object.keys(diff);
}

/**
 * Gets all the signatures prior to the target signature in the signature hierarchy.
 */
export function getSignatureAncestors(
  targetSignature: AllBsdaSignatureType | undefined | null
): AllBsdaSignatureType[] {
  if (!targetSignature) return [];

  const parent = Object.entries(SIGNATURES_HIERARCHY).find(
    ([_, details]) => details.next === targetSignature
  )?.[0];

  return [
    targetSignature,
    ...getSignatureAncestors(parent as AllBsdaSignatureType)
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

  const transporters = bsda.transporters ?? [];

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
    isTransporter: transporters.some(
      transporter =>
        (transporter.transporterCompanySiret != null &&
          orgIds.includes(transporter.transporterCompanySiret)) ||
        (transporter.transporterCompanyVatNumber != null &&
          orgIds.includes(transporter.transporterCompanyVatNumber))
    )
  };
}

/**
 * Renvoie la dernière signature en date sur un BSDA
 */
export function getCurrentSignatureType(
  bsda: ZodBsda
): AllBsdaSignatureType | undefined {
  /**
   * Fonction interne récursive qui parcourt la hiérarchie des signatures et
   * renvoie les signatures présentes sur le bordereau
   */
  function getSignatures(
    current: AllBsdaSignatureType,
    acc: AllBsdaSignatureType[]
  ) {
    const signature = SIGNATURES_HIERARCHY[current];
    const signatureDate = signature.signatureDate(bsda);
    const hasCurrentSignature = Boolean(signatureDate);
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
