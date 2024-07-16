import { Bsvhu, User } from "@prisma/client";
import { BsvhuInput, SignatureTypeInput } from "../../generated/graphql/types";
import { BSVHU_SIGNATURES_HIERARCHY } from "./constants";
import { ZodBsvhu, ZodOperationEnum, ZodWasteCodeEnum } from "./schema";
import { BsvhuUserFunctions } from "./types";
import { getUserCompanies } from "../../users/database";
import { flattenVhuInput } from "../converter";
import { safeInput } from "../../common/converter";
import { objectDiff } from "../../forms/workflow/diff";

/**
 * Cette fonction permet de convertir les données d'input GraphQL
 * vers le format attendu par le parsing Zod. Certains champs sont
 * typés en string côté GraphQL mais en enum côté Zod ce qui nous oblige
 * à faire un casting de type.
 */
export async function graphQlInputToZodBsvhu(
  input: BsvhuInput
): Promise<ZodBsvhu> {
  const { ...bsvhuInput } = input;

  const {
    wasteCode,
    destinationPlannedOperationCode,
    destinationOperationCode,
    ...flatBsvhuInput
  } = flattenVhuInput(bsvhuInput);

  return safeInput({
    ...flatBsvhuInput,
    destinationPlannedOperationCode:
      destinationPlannedOperationCode as ZodOperationEnum,
    destinationOperationCode: destinationOperationCode as ZodOperationEnum,
    wasteCode: wasteCode as ZodWasteCodeEnum
  });
}

/**
 * Cette fonction permet de convertir les données prisma
 * vers le format attendu par le parsing Zod. Certains champs sont
 * typés en string côté Prisma mais en enum côté Zod ce qui nous oblige
 * à faire un casting de type.
 */
export function prismaToZodBsvhu(bsvhu: Bsvhu): ZodBsvhu {
  const {
    wasteCode,
    weightValue,
    destinationPlannedOperationCode,
    destinationOperationCode,
    ...data
  } = bsvhu;

  return {
    ...data,
    wasteCode: wasteCode as ZodWasteCodeEnum,
    destinationPlannedOperationCode:
      destinationPlannedOperationCode as ZodOperationEnum,
    destinationOperationCode: destinationOperationCode as ZodOperationEnum
  };
}

export function getUpdatedFields<T extends ZodBsvhu>(
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
  targetSignature: SignatureTypeInput | undefined | null
): SignatureTypeInput[] {
  if (!targetSignature) return [];

  const parent = Object.entries(BSVHU_SIGNATURES_HIERARCHY).find(
    ([_, details]) => details.next === targetSignature
  )?.[0];

  return [
    targetSignature,
    ...getSignatureAncestors(parent as SignatureTypeInput)
  ];
}

export async function getBsvhuUserFunctions(
  user: User | undefined,
  bsvhu: ZodBsvhu
): Promise<BsvhuUserFunctions> {
  const companies = user ? await getUserCompanies(user.id) : [];
  const orgIds = companies.map(c => c.orgId);
  return {
    isEmitter:
      bsvhu.emitterCompanySiret != null &&
      orgIds.includes(bsvhu.emitterCompanySiret),
    isDestination:
      bsvhu.destinationCompanySiret != null &&
      orgIds.includes(bsvhu.destinationCompanySiret),
    isTransporter:
      (bsvhu.transporterCompanySiret != null &&
        orgIds.includes(bsvhu.transporterCompanySiret)) ||
      (bsvhu.transporterCompanyVatNumber != null &&
        orgIds.includes(bsvhu.transporterCompanyVatNumber))
  };
}

/**
 * Renvoie la dernière signature en date sur un BSVHU
 */
export function getCurrentSignatureType(
  bsvhu: ZodBsvhu
): SignatureTypeInput | undefined {
  /**
   * Fonction interne récursive qui parcourt la hiérarchie des signatures et
   * renvoie les signatures présentes sur le bordereau
   */
  function getSignatures(
    current: SignatureTypeInput,
    acc: SignatureTypeInput[]
  ) {
    const signature = BSVHU_SIGNATURES_HIERARCHY[current];
    const hasCurrentSignature = signature.isSigned(bsvhu);
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
