import { Status, EmitterType, Company, Form, Prisma } from "@td/prisma";
import { prisma } from "@td/prisma";
import { getReadableId, reindex } from "back";

export interface BsddOpt {
  ownerId: string;
  customId?: string;
  status?: Status;
  emitterWorkSiteName?: string;
  emitterType?: EmitterType;
  recipientCap?: string;
  wasteDetailsCode?: string;
  recipientIsTempStorage?: boolean;
  // Companies
  emitter: Company;
  transporters?: Company[];
  recipient?: Company;
  trader?: Company;
  ecoOrganisme?: Company;
  nextDestination?: Company;
}

const optToFormCreateInput = (opt: BsddOpt): Prisma.FormCreateInput => {
  return {
    owner: { connect: { id: opt.ownerId } },
    readableId: getReadableId(),
    status: opt.status ?? Status.PROCESSED,
    customId: opt.customId,
    emitterWorkSiteName: opt.emitterWorkSiteName,
    emitterType: opt.emitterType ?? EmitterType.PRODUCER,
    wasteDetailsCode: opt.wasteDetailsCode,
    recipientCap: opt.recipientCap,
    recipientIsTempStorage: opt.recipientIsTempStorage,
    // Companies
    emitterCompanySiret: opt.emitter.siret,
    emitterCompanyName: opt.emitter.name,
    recipientCompanySiret: opt.recipient?.siret,
    recipientCompanyName: opt.recipient?.name,
    traderCompanySiret: opt.trader?.siret,
    traderCompanyName: opt.trader?.name,
    ecoOrganismeSiret: opt.ecoOrganisme?.siret,
    ecoOrganismeName: opt.ecoOrganisme?.name,
    nextDestinationCompanySiret: opt.nextDestination?.siret,
    nextDestinationCompanyName: opt.nextDestination?.name,
    ...(opt.transporters
      ? {
          transportersSirets: opt.transporters.map(
            transporter => transporter.orgId
          ),
          transporters: {
            createMany: {
              data:
                opt.transporters?.map((transporter, index) => ({
                  number: index + 1,
                  transporterCompanySiret: transporter.siret,
                  transporterCompanyVatNumber: transporter.vatNumber,
                  transporterCompanyName: transporter.name
                })) ?? []
            }
          }
        }
      : {})
  };
};

export const seedBsdd = async (opt: BsddOpt) => {
  const bsdd = await prisma.form.create({
    data: optToFormCreateInput(opt)
  });

  // Add the bsdd to ES
  await reindex(bsdd.readableId, () => {});

  return bsdd;
};

export const getBsdd = async (id: string): Promise<Form> => {
  return prisma.form.findFirstOrThrow({
    where: { id }
  });
};

export const seedFormGroupment = async (initial, next) => {
  const bsdd = await prisma.formGroupement.create({
    data: {
      initialFormId: initial.id,
      nextFormId: next.id,
      quantity: 1
    }
  });

  // Add the bsdd to ES
  await reindex(initial.readableId, () => {});
  await reindex(next.readableId, () => {});

  return bsdd;
};
