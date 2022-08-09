import prisma from "../../prisma";
import { subSeconds } from "date-fns";
import { Prisma } from "@prisma/client";
import { randomChoice, getReadableId } from "./utils";
import { getBsdaObject } from "../../bsda/__tests__/factories";

const bsdaStatuses = [
  [true, "INITIAL"],
  [false, "INITIAL"],
  [false, "SIGNED_BY_PRODUCER"],
  [false, "SIGNED_BY_WORKER"],
  [false, "PROCESSED"]
];

const bulkBsdaFactory = async ({
  quantity = 1,
  opt = {}
}: {
  quantity: number;
  opt?: Partial<Prisma.BsdaCreateInput>;
}) => {
  const data = [];
  const baseDate = new Date();
  for (let i = 0; i < quantity; i++) {
    const created = subSeconds(baseDate, i * 10);

    const formParams = { ...getBsdaObject(), ...opt };
    const [isDraft, status] = randomChoice(bsdaStatuses);
    data.push({
      id: getReadableId(created, "BSDA"),
      createdAt: created,
      ...formParams,
      isDraft,
      status
    });
  }

  return prisma.bsda.createMany({
    data
  });
};

export async function createBsdas(userCompany, quantity) {
  const { siret } = userCompany;

  await bulkBsdaFactory({
    quantity,
    opt: {
      emitterCompanySiret: siret,
      transporterCompanySiret: siret,
      destinationCompanySiret: siret,
      workerCompanySiret: siret,

      wasteCode: "18 01 03*"
    }
  });
}
