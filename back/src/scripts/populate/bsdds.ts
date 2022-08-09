import { formdata } from "../../__tests__/factories";
import { subSeconds } from "date-fns";

import prisma from "../../prisma";

import { Prisma } from "@prisma/client";

import { randomChoice, getReadableId } from "./utils";
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
  const data = [];
  for (let i = 0; i < forms.length; i++) {
    const nb = getRandomInt(6);
    for (let j = 0; j <= nb; j++) {
      data.push({
        formId: forms[i].id,
        userId: forms[i].ownerId,
        status: randomChoice(formsStatuses),
        authType: randomChoice(["SESSION", "BEARER"]),
        updatedFields: {},
        loggedAt: subSeconds(baseDate, i * 10 + j)
      });
    }
  }

  await prisma.statusLog.createMany({
    data
  });

  return createStatusLogs(skip + take);
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
