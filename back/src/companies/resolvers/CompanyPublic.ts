import prisma from "../../prisma";
import { CompanyPublicResolvers } from "../../generated/graphql/types";

const companyPublicResolvers: CompanyPublicResolvers = {
  transporterReceipt: async parent => {
    return prisma.company
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
  }
};

export default companyPublicResolvers;
