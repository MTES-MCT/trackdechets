import { Company, Prisma } from "@prisma/client";
import type { RegistryV2ExportResolvers } from "@td/codegen-back";
import { GraphQLContext } from "../../types";

type ParentType = Prisma.RegistryExportGetPayload<{
  include: { createdBy: true };
}>;

export const RegistryV2Export: Omit<
  RegistryV2ExportResolvers<GraphQLContext, ParentType>,
  "delegate" | "companies"
> & {
  delegate: (
    parent: ParentType,
    args: unknown,
    context: GraphQLContext
  ) => Promise<Company | null>;
  companies: (
    parent: ParentType,
    args: unknown,
    context: GraphQLContext
  ) => Promise<Company[]>;
} = {
  registryType: parent => parent.registryType,
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
