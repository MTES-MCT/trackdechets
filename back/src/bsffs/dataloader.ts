import DataLoader from "dataloader";
import { prisma } from "@td/prisma";
import {
  BsffForParsingInclude,
  PrismaBsffForParsing
} from "./validation/bsff/types";

export function createBsffDataLoaders() {
  return {
    bsffs: new DataLoader<string, PrismaBsffForParsing>((bsffIds: string[]) =>
      getBsffs(bsffIds)
    )
  };
}

async function getBsffs(bsffIds: string[]): Promise<PrismaBsffForParsing[]> {
  const bsffs = await prisma.bsff.findMany({
    where: { id: { in: bsffIds } },
    include: BsffForParsingInclude
  });

  const dict = Object.fromEntries(
    bsffs.map((bsff: PrismaBsffForParsing) => [bsff.id, bsff])
  );

  return bsffIds.map(bsffId => dict[bsffId]);
}
