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

      packagings: [{ name: "BOUTEILLE 2L", numero: "01", weight: 1 }],

      ...formParams,
      isDraft,
      status
    });
  }

  return prisma.bsff.createMany({
    data
  });
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
