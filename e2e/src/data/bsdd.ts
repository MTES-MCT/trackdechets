import { Status, EmitterType, Company, Form } from "@prisma/client";
import { prisma } from "@td/prisma";
import { getReadableId, reindex } from "back";

export interface BsddOpt {
  ownerId: string;
  customId?: string;
  status?: Status;
  emitterPickupSite?: string;
  emitterType?: EmitterType;
  recipientCap?: string;
  grouping?: Form[];
  wasteDetailsCode?: string;
  recipientIsTempStorage?: boolean;
  forwardedIn?: BsddOpt;
  // Companies
  emitter: Company;
  transporters?: Company[];
  recipient?: Company;
  broker?: Company;
  trader?: Company;
  ecoOrganisme?: Company;
}

const optToFormCreateInput = (opt: BsddOpt) => {
  return {
    owner: { connect: { id: opt.ownerId } },
    readableId: getReadableId(),
    status: opt.status ?? Status.PROCESSED,
    customId: opt.customId,
    emitterPickupSite: opt.emitterPickupSite,
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
    ecoOrganismeSiret: opt.ecoOrganisme?.orgId,
    ecoOrganismeName: opt.ecoOrganisme?.orgId,
    ...(opt.transporters
      ? {
          transporters: {
            createMany: {
              data:
                opt.transporters?.map((transporter, index) => ({
                  number: index + 1,
                  transporterCompanySiret: transporter.orgId,
                  transporterCompanyVatNumber: transporter.vatNumber,
                  transporterCompanyName: transporter.name
                })) ?? []
            }
          }
        }
      : {}),
    ...(opt.grouping
      ? {
          grouping: {
            createMany: {
              data: opt.grouping?.map(bsdd => ({
                initialFormId: bsdd.id,
                quantity: 0
              }))
            }
          }
        }
      : {}),
    ...(opt.forwardedIn
      ? {
          forwardedIn: {
            create: {
              ...optToFormCreateInput(opt.forwardedIn)
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
