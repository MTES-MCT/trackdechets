import { prisma } from "../../generated/prisma-client";
import { getUserRole, getCompanyUsers } from "../database";
import { CompanyPrivateResolvers } from "../../generated/graphql/types";

const companyPrivateResolvers: CompanyPrivateResolvers = {
  users: parent => {
    return getCompanyUsers(parent.siret);
  },
  userRole: (parent, _, context) => {
    const userId = context.user.id;
    return getUserRole(userId, parent.siret);
  },
  transporterReceipt: parent =>
    prisma.company({ siret: parent.siret }).transporterReceipt(),
  traderReceipt: parent =>
    prisma.company({ siret: parent.siret }).traderReceipt()
};

export default companyPrivateResolvers;
