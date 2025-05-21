import { Prisma } from "@prisma/client";
import type { RegistryExhaustiveExportResolvers } from "@td/codegen-back";
import { GraphQLContext } from "../../types";

export const RegistryExhaustiveExport: RegistryExhaustiveExportResolvers<
  GraphQLContext,
  Prisma.RegistryExhaustiveExportGetPayload<{ include: { createdBy: true } }>
> = {
  companies: async (parent, _, context) => {
    const res = await Promise.all(
      parent.sirets?.map(siret => context.dataloaders.companies.load(siret))
    );
    return res.filter(Boolean);
  }
};
