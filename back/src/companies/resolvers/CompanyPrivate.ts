import { prisma } from "@td/prisma";
import { CompanyPrivateResolvers } from "../../generated/graphql/types";
import { getCompanyUsers } from "../database";
import { getUserRole, grants, toGraphQLPermission } from "../../permissions";

const companyPrivateResolvers: CompanyPrivateResolvers = {
  users: async (parent, _, context) => {
    const userId = context.user!.id;
    return getCompanyUsers(
      parent.orgId,
      context.dataloaders,
      userId,
      context.user!.isAdmin
    );
  },
  userRole: async (parent, _, context) => {
    if (parent.userRole) {
      return parent.userRole;
    }

    const userId = context.user!.id;
    const role = await getUserRole(userId, parent.orgId);
    return role!;
  },
  userPermissions: async (parent, _, context) => {
    const role =
      parent.userRole ?? (await getUserRole(context.user!.id, parent.orgId));
    return role ? grants[role].map(toGraphQLPermission) : [];
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
