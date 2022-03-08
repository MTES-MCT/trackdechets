import prisma from "../../prisma";
import { CompanyPrivateResolvers } from "../../generated/graphql/types";
import { getCompanyUsers, getUserRole } from "../database";

const companyPrivateResolvers: CompanyPrivateResolvers = {
  users: async (parent, _, context) => {
    const userId = context.user.id;
    const userRole = await getUserRole(userId, parent.siret);
    if (userRole !== "ADMIN") {
      return [];
    }

    return getCompanyUsers(parent.siret, context.dataloaders);
  },
  userRole: (parent, _, context) => {
    const userId = context.user.id;
    return getUserRole(userId, parent.siret);
  },
  transporterReceipt: parent => {
    return prisma.company
      .findUnique({ where: { siret: parent.siret } })
      .transporterReceipt();
  },
  traderReceipt: parent => {
    return prisma.company
      .findUnique({ where: { siret: parent.siret } })
      .traderReceipt();
  },
  brokerReceipt: parent => {
    return prisma.company
      .findUnique({ where: { siret: parent.siret } })
      .brokerReceipt();
  },
  vhuAgrementBroyeur: parent => {
    return prisma.company
      .findUnique({ where: { siret: parent.siret } })
      .vhuAgrementBroyeur();
  },
  vhuAgrementDemolisseur: parent => {
    return prisma.company
      .findUnique({ where: { siret: parent.siret } })
      .vhuAgrementDemolisseur();
  },
  installation: (parent, _, context) => {
    return context.dataloaders.installations.load(parent.siret);
  }
};

export default companyPrivateResolvers;
