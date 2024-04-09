import { prisma } from "@td/prisma";
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
  receivedSignatureAutomations: async parent => {
    const automations = await prisma.company
      .findUnique({
        where: whereSiretOrVatNumber(parent as CompanyBaseIdentifiers)
      })
      .receivedSignatureAutomations({
        include: { from: true, to: true }
      });
    return (automations as any) ?? [];
  },
  workerCertification: parent =>
    prisma.company
      .findUnique({
        where: whereSiretOrVatNumber(parent as CompanyBaseIdentifiers)
      })
      .workerCertification(),
  users: async (parent, _, ctx) => {
    // Only admins can retrieve users through this API. This is used for impersonation
    if (!ctx.user?.isAdmin || !parent.trackdechetsId) {
      return [];
    }

    const associations = await prisma.companyAssociation.findMany({
      where: { companyId: parent.trackdechetsId },
      include: { user: true }
    });

    return associations.map(association => ({
      ...association.user,
      role: association.role
    }));
  }
};

export default companySearchPrivateResolvers;
