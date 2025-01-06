import { prisma } from "@td/prisma";
import type { CompanySearchResultResolvers } from "@td/codegen-back";
import { CompanyBaseIdentifiers } from "../types";

/**
 * For nested data resolvers of Company derivatives
 * in order to find the parent Company
 */
export const whereSiretOrVatNumber = (parent: CompanyBaseIdentifiers) => {
  if (parent.siret) {
    return { siret: parent.siret };
  } else if (!!parent.vatNumber) {
    return { vatNumber: parent.vatNumber };
  }
  throw new Error(`No siret or vatNumber provided to company filter`);
};

const companySearchResultResolvers: CompanySearchResultResolvers = {
  transporterReceipt: async parent => {
    const transporterReceipt = await prisma.company
      .findUnique({
        where: whereSiretOrVatNumber(parent as CompanyBaseIdentifiers)
      })
      .transporterReceipt();
    return transporterReceipt;
  },
  traderReceipt: async parent => {
    const traderReceipt = await prisma.company
      .findUnique({
        where: whereSiretOrVatNumber(parent as CompanyBaseIdentifiers)
      })
      .traderReceipt();
    return traderReceipt;
  },
  brokerReceipt: async parent => {
    return await prisma.company
      .findUnique({
        where: whereSiretOrVatNumber(parent as CompanyBaseIdentifiers)
      })
      .brokerReceipt();
  },
  vhuAgrementBroyeur: parent => {
    return prisma.company
      .findUnique({
        where: whereSiretOrVatNumber(parent as CompanyBaseIdentifiers)
      })
      .vhuAgrementBroyeur();
  },
  vhuAgrementDemolisseur: parent => {
    return prisma.company
      .findUnique({
        where: whereSiretOrVatNumber(parent as CompanyBaseIdentifiers)
      })
      .vhuAgrementDemolisseur();
  },
  workerCertification: parent => {
    return prisma.company
      .findUnique({
        where: whereSiretOrVatNumber(parent as CompanyBaseIdentifiers)
      })
      .workerCertification();
  },
  installation: (parent, _, context) => {
    return parent.siret
      ? context.dataloaders.installations.load(parent.siret!)
      : null;
  }
};

export default companySearchResultResolvers;
