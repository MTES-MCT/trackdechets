import { prisma } from "@td/prisma";
import { CompanySearchPrivateResolvers } from "@td/codegen-back";
import { CompanyBaseIdentifiers } from "../types";
import { whereSiretOrVatNumber } from "./CompanySearchResult";
import { getUserRoles } from "../../permissions";
import { getCompanyUsers } from "../database";

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
  receivedSignatureAutomations: async (parent, _, context) => {
    const userId = context.user!.id;
    const roles = await getUserRoles(userId);
    const userOrgIds = Object.keys(roles);

    const where = whereSiretOrVatNumber(parent as CompanyBaseIdentifiers);
    const whereOrgId = where?.siret ?? where.vatNumber;

    // prevent exposing sensitive data in companyPrivateInfos
    // return empty result if user is not member of requested company and save a db query
    if (!userOrgIds.includes(whereOrgId)) {
      return [];
    }
    const automations = await prisma.company
      .findUnique({
        where
      })
      .receivedSignatureAutomations({
        include: { from: true, to: true }
      });

    if (!automations) {
      return [];
    }

    return automations.filter(
      a => a.from.allowAppendix1SignatureAutomation
    ) as any;
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
    return getCompanyUsers(
      parent.orgId,
      ctx.dataloaders,
      ctx.user.id,
      ctx.user!.isAdmin
    );
  }
};

export default companySearchPrivateResolvers;
