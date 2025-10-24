import { BsffFicheIntervention, Prisma } from "@td/prisma";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindManyBsffFicheInterventionFn = (
  args: Prisma.BsffFicheInterventionFindManyArgs
) => Promise<BsffFicheIntervention[]>;

export function buildFindManyBsffFicheIntervention({
  prisma
}: ReadRepositoryFnDeps): FindManyBsffFicheInterventionFn {
  return args => {
    return prisma.bsffFicheIntervention.findMany(args);
  };
}
