import { Bsff, BsffPackaging, Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindUniqueBsffPackagingFn = (
  args: Prisma.BsffPackagingFindUniqueArgs
) => Promise<(BsffPackaging & { bsff: Bsff }) | null>;

export type FindUniqueBsffPackagingGetBsffFn = (
  args: Prisma.BsffPackagingFindUniqueArgs
) => Promise<Bsff | null>;

export type FindUniqueBsffPackagingGetNextPackagingFn = (
  args: Prisma.BsffPackagingFindUniqueArgs
) => Promise<(BsffPackaging & { bsff: Bsff }) | null>;

export function buildFindUniqueBsffPackaging({
  prisma
}: ReadRepositoryFnDeps): FindUniqueBsffPackagingFn {
  return async args => {
    return prisma.bsffPackaging.findUnique({
      where: args.where,
      include: { bsff: true, ...(args.include ?? {}) }
    });
  };
}

export function buildFindUniqueBsffPackagingGetBsff({
  prisma
}: ReadRepositoryFnDeps): FindUniqueBsffPackagingGetBsffFn {
  return async args => {
    return prisma.bsffPackaging.findUnique(args).bsff();
  };
}

export function buildFindUniqueBsffPackagingGetNextPackaging({
  prisma
}: ReadRepositoryFnDeps): FindUniqueBsffPackagingGetNextPackagingFn {
  return async args => {
    return prisma.bsffPackaging
      .findUnique(args)
      .nextPackaging({ include: { bsff: true } });
  };
}
