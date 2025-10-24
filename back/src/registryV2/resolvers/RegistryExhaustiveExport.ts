import { Company, Prisma } from "@td/prisma";
import type { RegistryExhaustiveExportResolvers } from "@td/codegen-back";
import { GraphQLContext } from "../../types";

type ParentType = Prisma.RegistryExhaustiveExportGetPayload<{
  include: { createdBy: true };
}>;

export const RegistryExhaustiveExport: Omit<
  RegistryExhaustiveExportResolvers<GraphQLContext, ParentType>,
  "companies"
> & {
  companies: (
    parent: ParentType,
    args: unknown,
    context: GraphQLContext
  ) => Promise<Company[]>;
} = {
  companies: async (parent, _, context) => {
    const res = await Promise.all(
      parent.sirets?.map(siret => context.dataloaders.companies.load(siret))
    );
    return res.filter(Boolean);
  }
};
