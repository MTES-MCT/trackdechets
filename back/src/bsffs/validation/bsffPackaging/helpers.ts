import { ZodBsffPackaging } from "./schema";
import { flattenBsffPackagingInput } from "../../converter";
import { BsffPackagingSignatureType } from "./types";
import { BSFF_PACKAGING_SIGNATURES_HIERARCHY } from "./constants";
import { ZodOperationEnum, ZodWasteCodeEnum } from "../bsff/schema";
import { BsffPackaging } from "@prisma/client";
import type { UpdateBsffPackagingInput } from "@td/codegen-back";
import { UserInputError } from "../../../common/errors";
import { safeInput } from "../../../common/converter";

/**
 * Cette fonction permet de convertir les données d'input GraphQL
 * vers le format attendu par le parsing Zod. Certains champs sont
 * typés en string côté GraphQL mais en enum côté Zod ce qui nous oblige
 * à faire un casting de type.
 */
export async function graphQlInputToZodBsffPackaging(
  input: UpdateBsffPackagingInput
): Promise<ZodBsffPackaging> {
  const flattened = flattenBsffPackagingInput(input);
  if (flattened.numero === null || flattened.numero === "") {
    // permet de gérer une incohérence entre le schéma GraphQL qui autorise
    // de passer la valeur `null` sur le champ `numero` et le schéma prisma
    // sur lequel `numero` est un champ requis
    throw new UserInputError(
      "Le numéro de contenant ne peut pas être nul ou vide"
    );
  } else {
    return safeInput({
      ...flattened,
      numero: flattened.numero,
      acceptationWasteCode: flattened.acceptationWasteCode as ZodWasteCodeEnum
    });
  }
}

/**
 * Cette fonction permet de convertir les données prisma
 * vers le format attendu par le parsing Zod. Certains champs sont
 * typés en string côté Prisma mais en enum côté Zod ce qui nous oblige
 * à faire un casting de type.
 */
export function prismaToZodBsffPackaging(
  bsffPackaging: BsffPackaging
): ZodBsffPackaging {
  const {
    id,
    type,
    other,
    volume,
    weight,
    emissionNumero,
    acceptationWasteCode,
    operationCode,
    operationNextDestinationPlannedOperationCode,
    ...p
  } = bsffPackaging;

  return {
    ...p,
    acceptationWasteCode: acceptationWasteCode as ZodWasteCodeEnum,
    operationCode: operationCode as ZodOperationEnum,
    operationNextDestinationPlannedOperationCode:
      operationNextDestinationPlannedOperationCode as ZodOperationEnum
  };
}

/**
 * Gets all the signatures prior to the target signature in the signature hierarchy.
 */
export function getSignatureAncestors(
  targetSignature: BsffPackagingSignatureType | undefined | null
): BsffPackagingSignatureType[] {
  if (!targetSignature) return [];

  const parent = Object.entries(BSFF_PACKAGING_SIGNATURES_HIERARCHY).find(
    ([_, details]) => details.next === targetSignature
  )?.[0];

  return [
    targetSignature,
    ...getSignatureAncestors(parent as BsffPackagingSignatureType)
  ];
}

/**
 * Renvoie la dernière signature en date sur un BSFF
 */
export function getCurrentSignatureType(
  bsffPackaging: ZodBsffPackaging
): BsffPackagingSignatureType | undefined {
  /**
   * Fonction interne récursive qui parcourt la hiérarchie des signatures et
   * renvoie les signatures présentes sur le bordereau
   */
  function getSignatures(
    current: BsffPackagingSignatureType,
    acc: BsffPackagingSignatureType[]
  ) {
    const signature = BSFF_PACKAGING_SIGNATURES_HIERARCHY[current];
    const hasCurrentSignature = signature.isSigned(bsffPackaging);
    const signatures = [...(hasCurrentSignature ? [current] : []), ...acc];
    if (signature.next) {
      return getSignatures(signature.next, signatures);
    }
    return signatures;
  }
  const signatures = getSignatures("ACCEPTATION", []);

  if (signatures.length > 0) {
    return signatures[0];
  }

  return undefined;
}
