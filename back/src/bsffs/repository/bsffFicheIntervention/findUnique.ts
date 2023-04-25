import { BsffFicheIntervention, Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindUniqueBsffFicheInterventionFn = (
  args: Prisma.BsffFicheInterventionFindUniqueArgs
) => Promise<BsffFicheIntervention | null>;

export function buildFinduniqueBsffFicheIntervention({
  prisma
}: ReadRepositoryFnDeps): FindUniqueBsffFicheInterventionFn {
  return async args => {
    return prisma.bsffFicheIntervention.findUnique(args);
  };
}
