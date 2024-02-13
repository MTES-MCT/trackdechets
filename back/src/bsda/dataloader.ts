import DataLoader from "dataloader";
import { prisma } from "@td/prisma";

export function createBsdaDataLoaders() {
  return {
    bsdas: new DataLoader((bsdaIds: string[]) => getBsdas(bsdaIds))
  };
}

async function getBsdas(bsdaIds: string[]) {
  const bsdas = await prisma.bsda.findMany({
    where: { id: { in: bsdaIds } },
    include: {
      intermediaries: true,
      grouping: true,
      forwarding: true,
      transporters: true
    }
  });

  const dict = Object.fromEntries(bsdas.map(bsda => [bsda.id, bsda]));

  return bsdaIds.map(bsdaId => dict[bsdaId]);
}
