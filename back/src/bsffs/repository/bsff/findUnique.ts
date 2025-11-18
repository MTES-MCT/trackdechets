import { BsffFicheIntervention, BsffPackaging, Prisma } from "@td/prisma";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindUniqueBsffFn = <Args extends Prisma.BsffFindUniqueArgs>(
  args: Args
) => Promise<Prisma.BsffGetPayload<Args>>;

export type FindUniqueBsffGetPackagingsFn = (
  bsffFindUniqueArgs: Prisma.BsffFindUniqueArgs,
  bsffPackagingsFindManyArgs?: Prisma.BsffPackagingFindManyArgs
) => Promise<BsffPackaging[] | null>;

export type FindUniqueBsffGetFicheInterventionsFn = (
  bsffFindUniqueArgs: Prisma.BsffFindUniqueArgs,
  bsffFicheInterventionsFindManyArgs?: Prisma.BsffFicheInterventionFindManyArgs
) => Promise<BsffFicheIntervention[] | null>;

export function buildFinduniqueBsff({
  prisma
}: ReadRepositoryFnDeps): FindUniqueBsffFn {
  return async <Args extends Prisma.BsffFindUniqueArgs>(args: Args) => {
    const bsff = await prisma.bsff.findFirst({
      ...args,
      where: { ...args.where, isDeleted: false }
    });

    return bsff as Prisma.BsffGetPayload<Args>;
  };
}

export function buildFindUniqueBsffGetPackagings({
  prisma
}: ReadRepositoryFnDeps): FindUniqueBsffGetPackagingsFn {
  return (bsffFindUniqueArgs, bsffPackagingsFindManyArgs = {}) => {
    return prisma.bsff
      .findUnique(bsffFindUniqueArgs)
      .packagings(bsffPackagingsFindManyArgs);
  };
}

export function buildFindUniqueBsffGetFicheInterventions({
  prisma
}: ReadRepositoryFnDeps): FindUniqueBsffGetFicheInterventionsFn {
  return (bsffFindUniqueArgs, bsffFicheInterventionsFindManyArgs = {}) => {
    return prisma.bsff
      .findUnique(bsffFindUniqueArgs)
      .ficheInterventions(bsffFicheInterventionsFindManyArgs);
  };
}
