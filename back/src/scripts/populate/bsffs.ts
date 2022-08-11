import prisma from "../../prisma";
import { subSeconds } from "date-fns";

import { Prisma } from "@prisma/client";

import { randomChoice, getReadableId } from "./utils";

const bsffStatuses = [
  [true, "INITIAL"],
  [false, "INITIAL"],
  [false, "SIGNED_BY_EMITTER"],
  [false, "SENT"],
  [false, "PROCESSED"]
];

const bulkBsffFactory = async ({
  quantity = 1,
  opt = {}
}: {
  quantity: number;
  opt?: Partial<Prisma.BsffCreateInput>;
}) => {
  const data = [];
  const baseDate = new Date();
  for (let i = 0; i < quantity; i++) {
    const formParams = { ...opt };
    const [isDraft, status] = randomChoice(bsffStatuses);
    const created = subSeconds(baseDate, i * 10);
    data.push({
      id: getReadableId(created, "FF"),
      createdAt: subSeconds(baseDate, i * 10),
      wasteCode: "14 06 01*",
      wasteAdr: "Mention ADR",
      wasteDescription: "Fluides",
      weightValue: 1,
      weightIsEstimate: false,
      destinationPlannedOperationCode: "D10",
      transporterTransportMode: "ROAD",

    
      ...formParams,
      isDraft,
      status
    });
  }
  const packagingData = data.map(bsff => ({
    bsffId: bsff.id,
    name: "BOUTEILLE",
    weight: 1,
    volume: 1,
    numero: "1"
  }));
  const createdBsff = await prisma.bsff.createMany({
    data
  });
  await prisma.bsffPackaging.createMany({
    data : packagingData
  });
  return createdBsff;
};

export async function createBsffs(userCompany, quantity) {
  const { siret } = userCompany;
  // const bsffCount = await prisma.bsff.count();
  // if (!!bsffCount) {
  //   return;
  // }
  await bulkBsffFactory({
    quantity,
    opt: {
      emitterCompanySiret: siret,
      transporterCompanySiret: siret,
      destinationCompanySiret: siret
    }
  });
}
