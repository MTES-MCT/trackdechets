import { Company, BsdaType, BsdaStatus, Bsda, Prisma } from "@prisma/client";
import { prisma } from "@td/prisma";
import { getReadableId, reindex, ReadableIdPrefix } from "back";

interface BsdaOpt {
  status?: BsdaStatus;
  emitterPickupSiteName?: string;
  wasteCode?: string;
  wasteMaterialName?: string;
  type?: BsdaType;
  forwardedIn?: BsdaOpt;
  grouping?: Bsda[];
  // Companies
  emitter?: Company;
  destination?: Company;
  broker?: Company;
  worker?: Company;
}

const optToBsdaCreateInput = (opt: BsdaOpt): Prisma.BsdaCreateInput => {
  return {
    id: getReadableId(ReadableIdPrefix.BSDA),
    status: opt.status ?? BsdaStatus.PROCESSED,
    emitterPickupSiteName: opt.emitterPickupSiteName,
    wasteCode: opt.wasteCode,
    wasteMaterialName: opt.wasteMaterialName,
    type: opt.type,
    // Companies
    emitterCompanySiret: opt.emitter?.siret,
    emitterCompanyName: opt.emitter?.name,
    destinationCompanySiret: opt.destination?.siret,
    destinationCompanyName: opt.destination?.name,
    workerCompanyName: opt.worker?.name,
    workerCompanySiret: opt.worker?.siret,
    brokerCompanyName: opt.broker?.name,
    brokerCompanySiret: opt.broker?.siret,
    ...(opt.grouping
      ? {
          grouping: {
            connect: opt.grouping?.map(bsda => ({ id: bsda.id }))
          }
        }
      : {}),
    ...(opt.forwardedIn
      ? {
          forwardedIn: {
            create: {
              ...optToBsdaCreateInput(opt.forwardedIn)
            }
          }
        }
      : {})
  };
};

export const seedBsda = async (opt: BsdaOpt) => {
  const bsda = await prisma.bsda.create({
    data: optToBsdaCreateInput(opt)
  });

  // Add the bsda to ES
  await reindex(bsda.id, () => {});

  return bsda;
};
