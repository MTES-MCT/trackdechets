import { BsffPackaging, Prisma } from "@td/prisma";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";
import { BsffWithTransporters } from "../../types";

export type FindUniqueBsffPackagingFn = <
  Args extends Prisma.BsffPackagingFindUniqueArgs
>(
  args: Args
) => Promise<Prisma.BsffPackagingGetPayload<Args>>;

export type FindUniqueBsffPackagingGetBsffFn = (
  args: Prisma.BsffPackagingFindUniqueArgs
) => Promise<BsffWithTransporters | null>;

export type FindUniqueBsffPackagingGetNextPackagingFn = (
  args: Prisma.BsffPackagingFindUniqueArgs
) => Promise<(BsffPackaging & { bsff: BsffWithTransporters }) | null>;

export function buildFindUniqueBsffPackaging({
  prisma
}: ReadRepositoryFnDeps): FindUniqueBsffPackagingFn {
  return async <Args extends Prisma.BsffPackagingFindUniqueArgs>(
    args: Args
  ) => {
    const p = await prisma.bsffPackaging.findUnique(args);
    return p as Prisma.BsffPackagingGetPayload<Args>;
  };
}

export function buildFindUniqueBsffPackagingGetBsff({
  prisma
}: ReadRepositoryFnDeps): FindUniqueBsffPackagingGetBsffFn {
  return async args => {
    return prisma.bsffPackaging
      .findUnique(args)
      .bsff({ include: { transporters: true } });
  };
}

export function buildFindUniqueBsffPackagingGetNextPackaging({
  prisma
}: ReadRepositoryFnDeps): FindUniqueBsffPackagingGetNextPackagingFn {
  return async args => {
    return prisma.bsffPackaging.findUnique(args).nextPackaging({
      include: { bsff: { include: { transporters: true } } }
    });
  };
}
