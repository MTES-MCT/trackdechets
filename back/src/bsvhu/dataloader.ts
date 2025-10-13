import DataLoader from "dataloader";
import { prisma } from "@td/prisma";
import {
  BsvhuWithIntermediaries,
  BsvhuWithIntermediariesInclude,
  BsvhuWithTransporters,
  BsvhuWithTransportersInclude
} from "./types";

export function createBsvhuDataLoaders() {
  return {
    bsvhus: new DataLoader<
      string,
      BsvhuWithIntermediaries & BsvhuWithTransporters
    >((bsvhuIds: string[]) => getBsvhus(bsvhuIds))
  };
}

async function getBsvhus(
  bsvhuIds: string[]
): Promise<(BsvhuWithIntermediaries & BsvhuWithTransporters)[]> {
  const bsvhus = await prisma.bsvhu.findMany({
    where: { id: { in: bsvhuIds } },
    include: {
      ...BsvhuWithIntermediariesInclude,
      ...BsvhuWithTransportersInclude
    }
  });

  const dict = Object.fromEntries(
    bsvhus.map((bsvhu: BsvhuWithIntermediaries & BsvhuWithTransporters) => [
      bsvhu.id,
      bsvhu
    ])
  );

  return bsvhuIds.map(bsvhuId => dict[bsvhuId]);
}
