import { Prisma } from "@td/prisma";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindManyBsffFicheInterventionFn = (
  args: Prisma.BsffFicheInterventionFindManyArgs
) => Promise<
  Prisma.BsffFicheInterventionGetPayload<{
    include: { packagings: true };
  }>[]
>;

export function buildFindManyBsffFicheIntervention({
  prisma
}: ReadRepositoryFnDeps): FindManyBsffFicheInterventionFn {
  return args => {
    return prisma.bsffFicheIntervention.findMany({
      ...args,
      include: {
        ...args.include,
        packagings: true
      }
    });
  };
}
