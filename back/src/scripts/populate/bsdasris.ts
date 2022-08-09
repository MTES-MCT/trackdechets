import prisma from "../../prisma";
import { subSeconds } from "date-fns";
import { Prisma } from "@prisma/client";
import { randomChoice, getReadableId } from "./utils";

const bsdasriStatuses = [
  [true, "INITIAL"],
  [false, "INITIAL"],
  [false, "SENT"],
  [false, "RECEIVED"],
  [false, "PROCESSED"]
];

const bulkDasrisFactory = async ({
  quantity = 1,
  opt = {}
}: {
  quantity: number;
  opt?: Partial<Prisma.BsdasriCreateInput>;
}) => {
  const data = [];
  const baseDate = new Date();
  for (let i = 0; i < quantity; i++) {
    const formParams = { ...opt };
    const [isDraft, status] = randomChoice(bsdasriStatuses);
    const created = subSeconds(baseDate, i * 10);

    data.push({
      createdAt: created,
      id: getReadableId(created, "DASRI"),
      wasteAdr: "code adr",
      ...formParams,
      isDraft,
      status
    });
  }

  return prisma.bsdasri.createMany({
    data
  });
};

export async function createBsdasris(userCompany, quantity) {
  const { siret } = userCompany;
  // const dasriCount = await prisma.bsdasri.count();
  // if (!!dasriCount) {
  //   return;
  // }

  await bulkDasrisFactory({
    quantity,
    opt: {
      emitterCompanySiret: siret,
      emitterWastePackagings: [
        { type: "BOITE_CARTON", volume: 22, quantity: 3 }
      ],

      transporterCompanySiret: siret,
      transporterWastePackagings: [
        { type: "BOITE_CARTON", volume: 22, quantity: 3 }
      ],
      destinationCompanySiret: siret,
      destinationWastePackagings: [
        { type: "BOITE_CARTON", volume: 22, quantity: 3 }
      ],

      wasteCode: "18 01 03*"
    }
  });
}
