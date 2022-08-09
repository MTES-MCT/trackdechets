import prisma from "../../prisma";
import { subSeconds } from "date-fns";

import { Prisma } from "@prisma/client";

import { randomChoice, getReadableId } from "./utils";
import { getVhuFormdata } from "../../bsvhu/__tests__/factories.vhu";

const bsVhuStatuses = [
  [true, "INITIAL"],
  [false, "INITIAL"],
  [false, "SIGNED_BY_PRODUCER"],
  [false, "SENT"],
  [false, "PROCESSED"]
];

const bulkVhuFactory = async ({
  quantity = 1,
  opt = {}
}: {
  quantity: number;
  opt?: Partial<Prisma.BsvhuCreateInput>;
}) => {
  const data = [];
  const baseDate = new Date();
  for (let i = 0; i < quantity; i++) {
    const created = subSeconds(baseDate, i * 10);
    const formParams = { ...getVhuFormdata(), ...opt };
    const [isDraft, status] = randomChoice(bsVhuStatuses);
    data.push({
      id: getReadableId(created, "VHU"),
      createdAt: created,
      ...formParams,
      isDraft,
      status
    });
  }

  return prisma.bsvhu.createMany({
    data
  });
};

export async function createBsvhus(userCompany, quantity) {
  const { siret } = userCompany;
  // const bsvhuCount = await prisma.bsvhu.count();
  // if (!!bsvhuCount) {
  //   return;
  // }
  await bulkVhuFactory({
    quantity,
    opt: {
      emitterCompanySiret: siret,
      transporterCompanySiret: siret,
      destinationCompanySiret: siret
    }
  });
}
