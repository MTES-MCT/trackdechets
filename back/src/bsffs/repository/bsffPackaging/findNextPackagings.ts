import { BsffPackaging } from "@td/prisma";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindNextPackagingsFn = (
  packagingId: string,
  maxHops?: number
) => Promise<BsffPackaging[]>;

/**
 * Returns next packagings in the traceability history of one packaging
 * `maxHops` allow to move forward in the history for a specific number of hops
 */
export function buildFindNextPackagings({
  prisma
}: ReadRepositoryFnDeps): FindNextPackagingsFn {
  return (packagingId, maxHops = Infinity) => {
    async function inner(
      packagingId: string,
      hops: number
    ): Promise<BsffPackaging[]> {
      if (hops >= maxHops) {
        return [];
      }

      const nextPackaging = await prisma.bsffPackaging
        .findUnique({
          where: { id: packagingId }
        })
        .nextPackaging();

      if (!nextPackaging) {
        return [];
      }

      return [nextPackaging, ...(await inner(nextPackaging.id, hops + 1))];
    }

    return inner(packagingId, 0);
  };
}
