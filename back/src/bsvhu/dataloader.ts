import DataLoader from "dataloader";
import { prisma } from "@td/prisma";
import { Bsvhu } from "@prisma/client";

export function createBsvhuDataLoaders() {
  return {
    bsvhus: new DataLoader((bsvhuIds: string[]) => getBsvhus(bsvhuIds))
  };
}

async function getBsvhus(bsvhuIds: string[]) {
  const bsvhus = await prisma.bsvhu.findMany({
    where: { id: { in: bsvhuIds } }
  });

  const dict = Object.fromEntries(
    bsvhus.map((bsvhu: Bsvhu) => [bsvhu.id, bsvhu])
  );

  return bsvhuIds.map(bsdaId => dict[bsdaId]);
}
