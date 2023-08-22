import prisma from "../../prisma";
import {
  CompanyPrivateResolvers,
  UserRole
} from "../../generated/graphql/types";
import { getCompanyUsers } from "../database";
import { getUserRole, grants, toGraphQLPermission } from "../../permissions";
import { nullIfNoValues } from "../../common/converter";

/**
 * Resolvers that maintain compatibility with nested receipts
 */
export const genericCompanyReceiptResolvers = {
  transporterReceipt: parent =>
    nullIfNoValues({
      receiptNumber: parent.transporterReceiptNumber,
      validityLimit: parent.transporterReceiptValidityLimit,
      department: parent.transporterReceiptDepartment,
      id: parent.orgId
    }),
  traderReceipt: parent =>
    nullIfNoValues({
      receiptNumber: parent.traderReceiptNumber,
      validityLimit: parent.traderReceiptValidityLimit,
      department: parent.traderReceiptDepartment,
      id: parent.orgId
    }),
  brokerReceipt: parent =>
    nullIfNoValues({
      receiptNumber: parent.brokerReceiptNumber,
      validityLimit: parent.brokerReceiptValidityLimit,
      department: parent.brokerReceiptDepartment,
      id: parent.orgId
    }),
  vhuAgrementBroyeur: parent =>
    nullIfNoValues({
      agrementNumber: parent.vhuAgrementBroyeurNumber,
      department: parent.vhuAgrementBroyeurDepartment,
      id: parent.orgId
    }),
  vhuAgrementDemolisseur: parent =>
    nullIfNoValues({
      agrementNumber: parent.vhuAgrementDemolisseurNumber,
      department: parent.vhuAgrementDemolisseurDepartment,
      id: parent.orgId
    }),
  workerCertification: parent =>
    nullIfNoValues({
      certificationNumber: parent.workerCertificationCertificationNumber,
      organisation: parent.workerCertificationOrganisation,
      hasSubSectionFour: parent.workerCertificationHasSubSectionFour,
      hasSubSectionThree: parent.workerCertificationHasSubSectionThree,
      validityLimit: parent.workerCertificationValidityLimit,
      id: parent.orgId
    }),
  installation: (parent, _, context) => {
    return context.dataloaders.installations.load(parent.orgId);
  }
};

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

    return getCompanyUsers(parent.orgId, context.dataloaders, userId);
  },
  userRole: async (parent, _, context) => {
    const userId = context.user!.id;
    const role = await getUserRole(userId, parent.orgId);
    // type casting is necessary here as long as we
    // do not expose READER and DRIVER role in the API
    return role as UserRole;
  },
  userPermissions: async (parent, _, context) => {
    const userId = context.user!.id;
    const role = await getUserRole(userId, parent.orgId);
    return role ? grants[role].map(toGraphQLPermission) : [];
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
  },
  ...genericCompanyReceiptResolvers
};

export default companyPrivateResolvers;
