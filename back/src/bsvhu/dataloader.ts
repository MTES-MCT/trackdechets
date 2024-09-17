import DataLoader from "dataloader";
import { prisma } from "@td/prisma";
import {
  BsvhuWithIntermediaries,
  BsvhuWithIntermediariesInclude
} from "./types";

export function createBsvhuDataLoaders() {
  return {
    bsvhus: new DataLoader<string, BsvhuWithIntermediaries>(
      (bsvhuIds: string[]) => getBsvhus(bsvhuIds)
    )
  };
}

async function getBsvhus(
  bsvhuIds: string[]
): Promise<BsvhuWithIntermediaries[]> {
  const bsvhus = await prisma.bsvhu.findMany({
    where: { id: { in: bsvhuIds } },
    include: BsvhuWithIntermediariesInclude
  });

  const dict = Object.fromEntries(
    bsvhus.map((bsvhu: BsvhuWithIntermediaries) => [bsvhu.id, bsvhu])
  );

  return bsvhuIds.map(bsvhuId => dict[bsvhuId]);
}
