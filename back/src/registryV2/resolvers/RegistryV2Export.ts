import { Prisma } from "@prisma/client";
import type { RegistryV2ExportResolvers } from "@td/codegen-back";
import { GraphQLContext } from "../../types";

export const RegistryV2Export: RegistryV2ExportResolvers<
  GraphQLContext,
  Prisma.RegistryExportGetPayload<{ include: { createdBy: true } }>
> = {
  registryType: parent => parent.registryType ?? "ALL",
  declarationType: parent => parent.declarationType ?? "ALL",
  delegate: async (parent, _, context) => {
    if (!parent.delegateSiret) {
      return null;
    }
    return context.dataloaders.companies.load(parent.delegateSiret);
  },
  companies: async (parent, _, context) => {
    const res = await Promise.all(
      parent.sirets?.map(siret => context.dataloaders.companies.load(siret))
    );
    return res.filter(Boolean);
  }
};
