import { formdata } from "../../__tests__/factories";
import { subSeconds } from "date-fns";

import prisma from "../../prisma";
import { populateSiretify } from "./utils";
import { Prisma } from "@prisma/client";

import { randomChoice, getReadableId, chunkArray } from "./utils";
import { getRandomInt } from "../../forms/readableId";
const formsStatuses = [
  "DRAFT",
  "SEALED",
  "SENT",
  "RECEIVED",
  "ACCEPTED",
  "PROCESSED"
];
const take = 1000;
export const createStatusLogs = async (skip = 0) => {
  const statusLogsCount = await prisma.statusLog.count();

  if (!!statusLogsCount) {
    return;
  }
  const forms = await prisma.form.findMany({
    select: { id: true, ownerId: true },
    take,
    skip
  });
  if (forms.length === 0) {
    return;
  }
  const baseDate = new Date();

  const chunks = chunkArray(forms, 10000);

  for (const chunk of chunks) {
    const chunkData = [];
    for (let i = 0; i < chunk.length; i++) {
      const nb = Math.max(getRandomInt(6), 2);
      for (let j = 0; j <= nb; j++) {
        chunkData.push({
          formId: chunk[i].id,
          userId: chunk[i].ownerId,
          status: randomChoice(formsStatuses),
          authType: randomChoice(["SESSION", "BEARER"]),
          updatedFields: {},
          loggedAt: subSeconds(baseDate, i * 10 + j)
        });
      }
    }

    await prisma.statusLog.createMany({
      data: chunkData
    });
  }
  return createStatusLogs();
};

export const bulkFormsFactory = async ({
  ownerId,
  quantity = 1,
  opt = {}
}: {
  ownerId: string;
  quantity: number;
  opt?: Partial<Prisma.FormCreateInput>;
}) => {
  const data = [];

  const baseDate = new Date();
  for (let i = 0; i < quantity; i++) {
    const formParams = { ...formdata, ...opt };
    const created = subSeconds(baseDate, i * 10);
    data.push({
      createdAt: created,
      readableId: getReadableId(created, "BSD"),
      ...formParams,
      status: randomChoice(formsStatuses),
      ownerId: ownerId
    });
  }

  return prisma.form.createMany({
    data
  });
};

export async function createForms(userCompany, quantity) {
  const { siret, userId } = userCompany;
  // const formCount = await prisma.form.count();
  // if (!!formCount) {
  //   return;
  // }
  await bulkFormsFactory({
    ownerId: userId,
    quantity,
    opt: {
      emitterCompanySiret: siret,
      transporterCompanySiret: siret,
      recipientCompanySiret: siret,
      sentAt: new Date(),
      wasteDetailsCode: "06 01 01*"
    }
  });
}

const segmentPayload = { transporterCompanySiret: "98765" };
export async function createSegments() {
  const segmentsCount = await prisma.transportSegment.count();
  if (!!segmentsCount) {
    return;
  }
  for (let i = 1; i <= 1000; i++) {
    const siret = populateSiretify(i);
    console.log(siret);
    const form = await prisma.form.findFirst({
      where: { emitterCompanySiret: siret }
    });
    if (!!form) {
      for (let j = 0; j <= 2; j++) {
        await prisma.transportSegment.create({
          data: {
            form: { connect: { id: form.id } },
            ...segmentPayload
          }
        });
      }
    }
  }
}
