import prisma from "../../prisma";
import { CompanyPublicResolvers } from "../../generated/graphql/types";
import { stringifyDates } from "../database";

const companyPublicResolvers: CompanyPublicResolvers = {
  transporterReceipt: async parent => {
    const transporterReceipt = await prisma.company
      .findUnique({ where: { siret: parent.siret } })
      .transporterReceipt();
    return stringifyDates(transporterReceipt);
  },
  traderReceipt: async parent => {
    const traderReceipt = await prisma.company
      .findUnique({ where: { siret: parent.siret } })
      .traderReceipt();
    return stringifyDates(traderReceipt);
  }
};

export default companyPublicResolvers;
