import { BsffType, User } from "@td/prisma";
import {
  ZodBsff,
  ZodBsffTransporter,
  ZodOperationEnum,
  ZodWasteCodeEnum
} from "./schema";
import { getUserCompanies } from "../../../users/database";
import { BSFF_SIGNATURES_HIERARCHY } from "./constants";
import { flattenBsffInput, flattenBsffTransporterInput } from "../../converter";
import type { BsffInput, BsffTransporterInput } from "@td/codegen-back";
import { safeInput } from "../../../common/converter";
import {
  BsffUserFunctions,
  PrismaBsffForParsing,
  AllBsffSignatureType
} from "./types";
import { getTransportersSync } from "../../database";
import { objectDiff } from "../../../forms/workflow/diff";
import { toBsffPackagingWithType } from "../../compat";
import { ZodBsffPackaging } from "../bsffPackaging/schema";
import { UserInputError } from "../../../common/errors";
import { prisma } from "@td/prisma";

export function graphqlInputToZodBsffTransporter(
  input?: BsffTransporterInput | null
): ZodBsffTransporter {
  return flattenBsffTransporterInput(input);
}

export async function getZodTransporters(
  input: BsffInput
): Promise<ZodBsffTransporter[] | undefined> {
  if (input.transporter !== undefined && input.transporters) {
    throw new UserInputError(
      "Vous ne pouvez pas utiliser les champs `transporter` et `transporters` en même temps"
    );
  }
  if (input.transporter) {
    // Couche de compatibilité avec l'API BSFF "pré multi-modal"
    // Les données de `input.transporter` correspondent au premier
    // transporteur.
    return [graphqlInputToZodBsffTransporter(input.transporter)];
  } else if (input.transporter === null || input.transporters?.length === 0) {
    return [];
  } else if (input.transporters?.length) {
    const dbTransporters = await prisma.bsffTransporter.findMany({
      where: { id: { in: input.transporters } }
    });
    // Vérifie que tous les identifiants correspondent bien à un transporteur BSFF en base
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
export async function graphQlInputToZodBsff(
  input: BsffInput
): Promise<ZodBsff> {
  const {
    packagings,
    ficheInterventions,
    forwarding,
    grouping,
    repackaging,
    ...bsffInput
  } = input;

  const { wasteCode, type, ...flatBsffInput } = flattenBsffInput(bsffInput);

  const transporters = await getZodTransporters(input);

  return safeInput({
    ...flatBsffInput,
    type,
    wasteCode: wasteCode as ZodWasteCodeEnum,
    transporters,
    packagings: packagings
      ?.map(toBsffPackagingWithType)
      .map(p => safeInput({ ...p, emissionNumero: p.numero })),
    ficheInterventions,
    forwarding,
    grouping,
    repackaging
  });
}

/**
 * Cette fonction permet de convertir les données prisma
 * vers le format attendu par le parsing Zod. Certains champs sont
 * typés en string côté Prisma mais en enum côté Zod ce qui nous oblige
 * à faire un casting de type.
 */
export function prismaToZodBsff(bsff: PrismaBsffForParsing): ZodBsff {
  const {
    transporters,
    packagings,
    wasteCode,
    weightValue,
    destinationPlannedOperationCode,
    ficheInterventions,
    ...data
  } = bsff;

  const previousPackagings = [
    ...new Set(packagings.flatMap(p => p.previousPackagings.map(p => p.id)))
  ];

  return {
    ...data,
    weightValue: weightValue?.toNumber(),
    wasteCode: wasteCode as ZodWasteCodeEnum,
    destinationPlannedOperationCode:
      destinationPlannedOperationCode as ZodOperationEnum,
    packagings: packagings.map(p => ({
      id: p.id,
      type: p.type,
      other: p.other,
      volume: p.volume,
      weight: p.weight,
      emissionNumero: p.emissionNumero,
      numero: p.numero,
      acceptationSignatureDate: p.acceptationSignatureDate,
      operationSignatureDate: p.operationSignatureDate
    })),
    transporters: getTransportersSync({ transporters }).map(t => {
      const { createdAt, updatedAt, ...transporterData } = t;
      return transporterData;
    }),
    ficheInterventions: ficheInterventions.map(fi => fi.id),
    // Le parsing Zod convertit `grouping`, `forwarding` et `repackaging` (champs GraphQL)
    // en packagings[n].previousPackagings  (champ Prisma) en fonction de la valeur de bsff.type
    // (cf transformers.checkAndSetPreviousPackagings)
    // Il faut donc faire ici la conversion inverse pour matcher le format attendu en entrée du parsing zod.
    grouping: bsff.type === BsffType.GROUPEMENT ? previousPackagings : [],
    forwarding: bsff.type === BsffType.REEXPEDITION ? previousPackagings : [],
    repackaging:
      bsff.type === BsffType.RECONDITIONNEMENT ? previousPackagings : []
  };
}

export function getUpdatedFields<
  T extends ZodBsff | ZodBsffTransporter | ZodBsffPackaging
>(val: T, update: T): string[] {
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
  targetSignature: AllBsffSignatureType | undefined | null
): AllBsffSignatureType[] {
  if (!targetSignature) return [];

  const parent = Object.entries(BSFF_SIGNATURES_HIERARCHY).find(
    ([_, details]) => details.next === targetSignature
  )?.[0];

  return [
    targetSignature,
    ...getSignatureAncestors(parent as AllBsffSignatureType)
  ];
}

export async function getBsffUserFunctions(
  user: User | undefined,
  bsff: ZodBsff
): Promise<BsffUserFunctions> {
  const companies = user ? await getUserCompanies(user.id) : [];
  const orgIds = companies.map(c => c.orgId);

  const transporters = bsff.transporters ?? [];

  return {
    isEmitter:
      bsff.emitterCompanySiret != null &&
      orgIds.includes(bsff.emitterCompanySiret),
    isDestination:
      bsff.destinationCompanySiret != null &&
      orgIds.includes(bsff.destinationCompanySiret),
    isTransporter: transporters.some(
      transporter =>
        (transporter.transporterCompanySiret != null &&
          orgIds.includes(transporter.transporterCompanySiret)) ||
        (transporter.transporterCompanyVatNumber != null &&
          orgIds.includes(transporter.transporterCompanyVatNumber))
    )
  };
}

export function getNextSignatureType(
  currentSignature: AllBsffSignatureType | undefined | null
): AllBsffSignatureType | undefined {
  if (!currentSignature) {
    return "EMISSION";
  }
  const signature = BSFF_SIGNATURES_HIERARCHY[currentSignature];
  if (signature.next) {
    return signature.next;
  }
  return undefined;
}

/**
 * Renvoie la dernière signature en date sur un BSFF
 */
export function getCurrentSignatureType(
  bsff: ZodBsff
): AllBsffSignatureType | undefined {
  /**
   * Fonction interne récursive qui parcourt la hiérarchie des signatures et
   * renvoie les signatures présentes sur le bordereau
   */
  function getSignatures(
    current: AllBsffSignatureType,
    acc: AllBsffSignatureType[]
  ) {
    const signature = BSFF_SIGNATURES_HIERARCHY[current];
    const hasCurrentSignature = signature.isSigned(bsff);
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
