import prisma from "../../prisma";
import { CompanyPrivateResolvers } from "../../generated/graphql/types";
import { getCompanyUsers, getUserRole } from "../database";

const companyPrivateResolvers: CompanyPrivateResolvers = {
  users: async (parent, _, context) => {
    const userId = context.user.id;
    const userRole = await getUserRole(userId, parent.orgId);
    if (userRole !== "ADMIN") {
      return [
        {
          ...context.user,
          role: userRole,
          isPendingInvitation: false
        }
      ];
    }

    return getCompanyUsers(parent.orgId, context.dataloaders);
  },
  userRole: (parent, _, context) => {
    const userId = context.user.id;
    return getUserRole(userId, parent.orgId);
  },
  transporterReceipt: parent => {
    return prisma.company
      .findUnique({ where: { id: parent.id } })
      .transporterReceipt();
  },
  traderReceipt: parent => {
    return prisma.company
      .findUnique({ where: { id: parent.id } })
      .traderReceipt();
  },
  brokerReceipt: parent => {
    return prisma.company
      .findUnique({ where: { id: parent.id } })
      .brokerReceipt();
  },
  vhuAgrementBroyeur: parent => {
    return prisma.company
      .findUnique({ where: { id: parent.id } })
      .vhuAgrementBroyeur();
  },
  vhuAgrementDemolisseur: parent => {
    return prisma.company
      .findUnique({ where: { id: parent.id } })
      .vhuAgrementDemolisseur();
  },
  workerCertification: parent => {
    return prisma.company
      .findUnique({ where: { id: parent.id } })
      .workerCertification();
  },
  installation: (parent, _, context) => {
    return context.dataloaders.installations.load(parent.orgId);
  }
};

export default companyPrivateResolvers;
