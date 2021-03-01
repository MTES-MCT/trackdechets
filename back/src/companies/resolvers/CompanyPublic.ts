import prisma from "../../prisma";
import { CompanyPublicResolvers } from "../../generated/graphql/types";

const companyPublicResolvers: CompanyPublicResolvers = {
  transporterReceipt: async parent => {
    return prisma.company
      .findUnique({ where: { siret: parent.siret } })
      .transporterReceipt();
  },
  traderReceipt: async parent => {
    return await prisma.company
      .findUnique({ where: { siret: parent.siret } })
      .traderReceipt();
  },
  brokerReceipt: async parent => {
    return await prisma.company
      .findUnique({ where: { siret: parent.siret } })
      .brokerReceipt();
  }
};

export default companyPublicResolvers;
