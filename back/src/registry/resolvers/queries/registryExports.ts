import { prisma } from "@td/prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { QueryRegistryExportsArgs } from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { getConnection } from "../../../common/pagination";
import { Prisma } from "@prisma/client";

export async function registryExports(
  _,
  { ...gqlPaginationArgs }: QueryRegistryExportsArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);
  const where: Prisma.RegistryExportWhereInput = {
    createdById: user.id
  };

  const totalCount = await prisma.registryExport.count({ where });

  return getConnection({
    totalCount,
    findMany: prismaPaginationArgs =>
      prisma.registryExport.findMany({
        where,
        ...prismaPaginationArgs,
        orderBy: { id: "desc" },
        include: { createdBy: true }
      }),
    formatNode: v => v,
    ...gqlPaginationArgs
  });
}
