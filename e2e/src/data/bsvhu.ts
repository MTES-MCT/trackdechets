import { Company, Prisma, BsvhuStatus } from "@td/prisma";
import { prisma } from "@td/prisma";
import { getReadableId, reindex, ReadableIdPrefix } from "back";

interface BsvhuOpt {
  status?: BsvhuStatus;
  // Companies
  destination?: Company;
  transporter?: Company;
}

const optToBsvhuCreateInput = (opt: BsvhuOpt): Prisma.BsvhuCreateInput => {
  return {
    id: getReadableId(ReadableIdPrefix.VHU),
    status: opt.status ?? BsvhuStatus.PROCESSED,
    // Companies
    destinationCompanySiret: opt.destination?.siret,
    destinationCompanyName: opt.destination?.name,
    transporters: {
      create: {
        number: 1,
        transporterCompanySiret: opt.transporter?.siret,
        transporterCompanyName: opt.transporter?.name
      }
    }
  };
};

export const seedBsvhu = async (opt: BsvhuOpt) => {
  const bsvhu = await prisma.bsvhu.create({
    data: optToBsvhuCreateInput(opt)
  });

  // Add the bsvhu to ES
  await reindex(bsvhu.id, () => {});

  return bsvhu;
};
