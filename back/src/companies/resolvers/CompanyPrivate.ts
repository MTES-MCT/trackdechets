import prisma from "../../prisma";
import { CompanyPrivateResolvers } from "../../generated/graphql/types";
import { getCompanyUsers, getUserRole, getInstallation } from "../database";

const companyPrivateResolvers: CompanyPrivateResolvers = {
  users: parent => {
    return getCompanyUsers(parent.siret);
  },
  userRole: (parent, _, context) => {
    const userId = context.user.id;
    return getUserRole(userId, parent.siret);
  },
  transporterReceipt: async parent => {
    return await prisma.company
      .findUnique({ where: { siret: parent.siret } })
      .transporterReceipt();
  },
  traderReceipt: async parent => {
    return await prisma.company
      .findUnique({ where: { siret: parent.siret } })
      .traderReceipt();
  },
  brokerReceipt: async parent => {
    return await prisma.company
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
  installation: async parent => {
    const installation = await getInstallation(parent.siret);
    return installation;
  }
};

export default companyPrivateResolvers;
