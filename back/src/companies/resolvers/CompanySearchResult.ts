import { prisma } from "../../generated/prisma-client";
import { CompanySearchResultResolvers } from "../../generated/graphql/types";

const companySearchResultResolvers: CompanySearchResultResolvers = {
  transporterReceipt: parent =>
    prisma.company({ siret: parent.siret }).transporterReceipt(),
  traderReceipt: parent =>
    prisma.company({ siret: parent.siret }).traderReceipt()
};

export default companySearchResultResolvers;
