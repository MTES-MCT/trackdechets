import { prisma } from "@td/prisma";
import type { CompanyPrivateResolvers } from "@td/codegen-back";
import { getCompanyUsers } from "../database";
import { getUserRole, grants, toGraphQLPermission } from "../../permissions";
import { toGqlNotifications } from "../../users/notifications";
import { toGqlCompanyPublic } from "../converters";

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
  userNotifications: async (parent, _, context) => {
    const companyAssociation = await prisma.companyAssociation.findFirstOrThrow(
      { where: { companyId: parent.id, userId: context.user?.id } }
    );
    return toGqlNotifications(companyAssociation);
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
  receivedSignatureAutomations: async parent => {
    const automations = await prisma.company
      .findUnique({ where: { id: parent.id } })
      .receivedSignatureAutomations({
        include: { from: true, to: true }
      });

    if (!automations) {
      return [];
    }

    return automations.filter(
      a => a.from.allowAppendix1SignatureAutomation
    ) as any;
  },
  givenAdministrativeTransfers: parent => {
    return prisma.company
      .findUnique({ where: { id: parent.id } })
      .givenAdministrativeTransfers() as any;
  },
  receivedAdministrativeTransfers: parent => {
    return prisma.company
      .findUnique({ where: { id: parent.id } })
      .receivedAdministrativeTransfers() as any;
  },
  delegators: async (parent, _, context) => {
    const res = await context.dataloaders.delegators.load(parent.id);
    return res.map(toGqlCompanyPublic);
  }
};

export default companyPrivateResolvers;
