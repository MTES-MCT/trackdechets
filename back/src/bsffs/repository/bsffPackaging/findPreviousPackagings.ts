import { BsffPackaging } from "@td/prisma";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindPreviousPackagingsFn = (
  packagingIds: string[],
  maxHops?: number
) => Promise<BsffPackaging[]>;

/**
 * Returns previous packagings in the traceability history of one or several packagings
 * `maxHops` allows to only go back in the history for a specific number of hops
 */
export function buildFindPreviousPackagings({
  prisma
}: ReadRepositoryFnDeps): FindPreviousPackagingsFn {
  return (packagingIds, maxHops = Infinity) => {
    async function inner(
      packagingIds: string[],
      hops: number
    ): Promise<BsffPackaging[]> {
      if (hops >= maxHops) {
        return [];
      }

      const packagings = await prisma.bsffPackaging.findMany({
        where: { id: { in: packagingIds } },
        include: { previousPackagings: true }
      });

      const previousPackagings = packagings.flatMap(p => p.previousPackagings);

      if (previousPackagings.length === 0) {
        return [];
      }

      return [
        ...(await inner(
          previousPackagings.map(p => p.id),
          hops + 1
        )),
        ...previousPackagings
      ];
    }

    return inner(packagingIds, 0);
  };
}
