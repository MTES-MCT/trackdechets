import prisma from "../../prisma";
import { CompanyPrivateResolvers } from "../../generated/graphql/types";
import { getCompanyUsers, getUserRole } from "../database";

const companyPrivateResolvers: CompanyPrivateResolvers = {
  users: (parent, _, context) => {
    return getCompanyUsers(parent.siret, context.dataloaders);
  },
  userRole: (parent, _, context) => {
    const userId = context.user.id;
    return getUserRole(userId, parent.siret);
  },
  transporterReceipt: async parent => {
    return prisma.company
      .findUnique({ where: { siret: parent.siret } })
      .transporterReceipt();
  },
  traderReceipt: async parent => {
    return prisma.company
      .findUnique({ where: { siret: parent.siret } })
      .traderReceipt();
  },
  brokerReceipt: async parent => {
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
  installation: async (parent, _, context) => {
    return context.dataloaders.installations.load(parent.siret);
  }
};

export default companyPrivateResolvers;
