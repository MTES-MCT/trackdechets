import DataLoader from "dataloader";
import { prisma } from "@td/prisma";
import { PrismaBspaohWithTransporters } from "./types";

export function createBspaohDataLoaders() {
  return {
    bspaohs: new DataLoader((bspaohIds: string[]) => getBspaohs(bspaohIds))
  };
}

async function getBspaohs(bspaohIds: string[]) {
  const bspaohs = await prisma.bspaoh.findMany({
    where: { id: { in: bspaohIds } },
    include: { transporters: true }
  });

  const dict = Object.fromEntries(
    bspaohs.map((bspaoh: PrismaBspaohWithTransporters) => [bspaoh.id, bspaoh])
  );

  return bspaohIds.map(bsdaId => dict[bsdaId]);
}
