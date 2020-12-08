import prisma from "src/prisma";
import { CompanyFavoriteResolvers } from "../../generated/graphql/types";
import { stringifyDates } from "../database";

const companyFavoriteResolvers: CompanyFavoriteResolvers = {
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

export default companyFavoriteResolvers;
