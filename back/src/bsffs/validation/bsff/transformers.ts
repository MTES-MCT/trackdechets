import { ZodBsffTransformer } from "./types";
import { BsffType } from "@prisma/client";
import { checkPreviousPackagings } from "./refinements";

/**
 * Applique les vérifications sur les contenants à réexpédier / grouper / reconditionner puis applique
 * les transformations suivantes :
 * - Définit la valeur du champ `packagings` à partir des packagings qui sont regroupés / réexpédiés
 * - Convertir `grouping`, `repackaging` et `forwarding` en un seul champ `previousPackagings` sur les contenants.
 */
export const checkAndSetPreviousPackagings: ZodBsffTransformer = async (
  bsff,
  ctx
) => {
  const previousPackagings = await checkPreviousPackagings(bsff, ctx);

  const { forwarding, grouping, repackaging, ...rest } = bsff;

  if (
    bsff.type === BsffType.GROUPEMENT ||
    bsff.type === BsffType.REEXPEDITION
  ) {
    return {
      ...rest,
      packagings: previousPackagings.map(p => ({
        // Reprend les informations de base des contenants en cas de
        // groupement ou de rééxpedition
        type: p.type,
        other: p.other,
        numero: p.numero,
        emissionNumero: p.numero,
        volume: p.volume,
        weight: p.acceptationWeight ?? 0,
        operationNoTraceability: false,
        previousPackagings: [p.id]
      }))
    };
  } else if (bsff.type === BsffType.RECONDITIONNEMENT) {
    return {
      ...rest,
      packagings: bsff.packagings?.map(p => ({
        ...p,
        previousPackagings: previousPackagings.map(p => p.id)
      }))
    };
  }
  return rest;
};
