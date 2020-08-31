import { prisma } from "../../generated/prisma-client";
import { CompanyPublicResolvers } from "../../generated/graphql/types";

const companyPublicResolvers: CompanyPublicResolvers = {
  transporterReceipt: parent =>
    prisma.company({ siret: parent.siret }).transporterReceipt(),
  traderReceipt: parent =>
    prisma.company({ siret: parent.siret }).traderReceipt()
};

export default companyPublicResolvers;
