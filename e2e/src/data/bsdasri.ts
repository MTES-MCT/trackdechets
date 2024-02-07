import { Company, Prisma, BsdasriStatus, BsdasriType } from "@prisma/client";
import { prisma } from "@td/prisma";
import { getReadableId, reindex, ReadableIdPrefix } from "back";

interface BsdasriOpt {
  status?: BsdasriStatus;
  type?: BsdasriType;
  // Companies
  emitter?: Company;
  destination?: Company;
}

const optToBsdasriCreateInput = (
  opt: BsdasriOpt
): Prisma.BsdasriCreateInput => {
  return {
    id: getReadableId(ReadableIdPrefix.DASRI),
    status: opt.status ?? BsdasriStatus.PROCESSED,
    type: opt.type ?? BsdasriType.SIMPLE,
    // Companies
    emitterCompanySiret: opt.emitter?.siret,
    emitterCompanyName: opt.emitter?.name,
    destinationCompanySiret: opt.destination?.siret,
    destinationCompanyName: opt.destination?.name
  };
};

export const seedBsdasri = async (opt: BsdasriOpt) => {
  const bsdasri = await prisma.bsdasri.create({
    data: optToBsdasriCreateInput(opt)
  });

  // Add the bsdasri to ES
  await reindex(bsdasri.id, () => {});

  return bsdasri;
};
