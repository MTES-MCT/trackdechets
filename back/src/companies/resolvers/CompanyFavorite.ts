import { prisma } from "../../generated/prisma-client";
import { CompanyFavoriteResolvers } from "../../generated/graphql/types";

const companyFavoriteResolvers: CompanyFavoriteResolvers = {
  transporterReceipt: parent =>
    prisma.company({ siret: parent.siret }).transporterReceipt(),
  traderReceipt: parent =>
    prisma.company({ siret: parent.siret }).traderReceipt()
};

export default companyFavoriteResolvers;
