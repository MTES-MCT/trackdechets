import prisma from "../../prisma";
import {
  CompanyPrivateResolvers,
  UserRole
} from "../../generated/graphql/types";
import { getCompanyUsers, getUserRole } from "../database";

const companyPrivateResolvers: CompanyPrivateResolvers = {
  users: async (parent, _, context) => {
    const userId = context.user!.id;
    const userRole = await getUserRole(userId, parent.orgId);

    if (userRole !== "ADMIN") {
      return [
        {
          ...context.user!,
          // type casting is necessary here as long as we
          // do not expose READER and DRIVER role in the API
          role: userRole as UserRole,
          isPendingInvitation: false
        }
      ];
    }

    return getCompanyUsers(parent.orgId, context.dataloaders);
  },
  userRole: async (parent, _, context) => {
    const userId = context.user!.id;
    const role = await getUserRole(userId, parent.orgId);
    // type casting is necessary here as long as we
    // do not expose READER and DRIVER role in the API
    return role as UserRole;
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
  },
  signatureAutomations: parent => {
    return prisma.company
      .findUnique({ where: { id: parent.id } })
      .givenSignatureAutomations({ include: { from: true, to: true } }) as any;
  },
  receivedSignatureAutomations: parent => {
    return prisma.company
      .findUnique({ where: { id: parent.id } })
      .receivedSignatureAutomations({
        include: { from: true, to: true }
      }) as any;
  }
};

export default companyPrivateResolvers;
