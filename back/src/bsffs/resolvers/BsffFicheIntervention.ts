import type { BsffFicheInterventionResolvers } from "@td/codegen-back";
import { getReadonlyBsffPackagingRepository } from "../repository";
import { expandBsffPackagingFromDB } from "../converter";

export const BsffFicheIntervention: BsffFicheInterventionResolvers = {
  packagings: async ficheIntervention => {
    const { findMany } = getReadonlyBsffPackagingRepository();

    const packagings = await findMany({
      where: {
        ficheInterventions: { some: { id: ficheIntervention.id } }
      }
    });

    if (!packagings?.length) return [];

    return packagings.map(p => expandBsffPackagingFromDB(p));
  }
};
