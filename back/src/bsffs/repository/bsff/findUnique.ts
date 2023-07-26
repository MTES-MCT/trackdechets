import {
  Bsff,
  BsffFicheIntervention,
  BsffPackaging,
  Prisma
} from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindUniqueBsffFn = (args: Prisma.BsffFindUniqueArgs) => Promise<
  | (Bsff & { packagings: BsffPackaging[] } & {
      ficheInterventions: BsffFicheIntervention[];
    })
  | null
>;

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
  return async args => {
    const bsff = await prisma.bsff.findFirst({
      where: { ...args.where, isDeleted: false },
      include: {
        packagings: true,
        ficheInterventions: true,
        ...(args.include ?? {})
      }
    });

    return bsff;
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
