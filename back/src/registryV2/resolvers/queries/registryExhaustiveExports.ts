import { prisma } from "@td/prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { QueryRegistryExhaustiveExportsArgs } from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { getConnection } from "../../../common/pagination";
import { Prisma } from "@prisma/client";

export async function registryExhaustiveExports(
  _,
  { ...gqlPaginationArgs }: QueryRegistryExhaustiveExportsArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);
  const where: Prisma.RegistryExhaustiveExportWhereInput = {
    createdById: user.id
  };

  const totalCount = await prisma.registryExhaustiveExport.count({ where });

  return getConnection({
    totalCount,
    findMany: prismaPaginationArgs =>
      prisma.registryExhaustiveExport.findMany({
        where,
        ...prismaPaginationArgs,
        orderBy: { id: "desc" },
        include: { createdBy: true }
      }),
    formatNode: v => v,
    ...gqlPaginationArgs
  });
}
