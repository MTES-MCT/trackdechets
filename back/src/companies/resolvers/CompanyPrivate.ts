import prisma from "../../prisma";
import { CompanyPrivateResolvers } from "../../generated/graphql/types";
import { getCompanyUsers, getUserRole, stringifyDates } from "../database";

const companyPrivateResolvers: CompanyPrivateResolvers = {
  users: parent => {
    return getCompanyUsers(parent.siret);
  },
  userRole: (parent, _, context) => {
    const userId = context.user.id;
    return getUserRole(userId, parent.siret);
  },
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

export default companyPrivateResolvers;
