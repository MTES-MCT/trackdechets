import prisma from "../../prisma";
import { CompanySearchPrivateResolvers } from "../../generated/graphql/types";
import { CompanyBaseIdentifiers } from "../types";
import { whereSiretOrVatNumber } from "./CompanySearchResult";

const companySearchPrivateResolvers: CompanySearchPrivateResolvers = {
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
  receivedSignatureAutomations: parent => {
    return prisma.company
      .findUnique({ where: { orgId: parent.orgId } })
      .receivedSignatureAutomations({
        include: { from: true, to: true }
      }) as any;
  },
  workerCertification: parent => {
    return prisma.company
      .findUnique({ where: { id: parent.orgId } })
      .workerCertification();
  }
};

export default companySearchPrivateResolvers;
