import prisma from "../../prisma";
import { CompanyFavoriteResolvers } from "@trackdechets/codegen/src/back.gen";
import { whereSiretOrVatNumber } from "./CompanySearchResult";
import { CompanyBaseIdentifiers } from "../types";

const companyFavoriteResolvers: CompanyFavoriteResolvers = {
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
    const brokerReceipt = await prisma.company
      .findUnique({
        where: whereSiretOrVatNumber(parent as CompanyBaseIdentifiers)
      })
      .brokerReceipt();
    return brokerReceipt;
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
  }
};

export default companyFavoriteResolvers;
