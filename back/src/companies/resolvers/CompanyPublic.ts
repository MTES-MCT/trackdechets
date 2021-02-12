import prisma from "../../prisma";
import { CompanyPublicResolvers } from "../../generated/graphql/types";

const companyPublicResolvers: CompanyPublicResolvers = {
  transporterReceipt: async parent => {
    const transporterReceipt = await prisma.company
      .findUnique({ where: { siret: parent.siret } })
      .transporterReceipt();
    return transporterReceipt;
  },
  traderReceipt: async parent => {
    const traderReceipt = await prisma.company
      .findUnique({ where: { siret: parent.siret } })
      .traderReceipt();
    return traderReceipt;
  }
};

export default companyPublicResolvers;
