import { prisma } from "@td/prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { QueryRegistryV2ExportsArgs } from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { getConnection } from "../../../common/pagination";
import { Prisma } from "@prisma/client";

export async function registryV2Exports(
  _,
  { ...gqlPaginationArgs }: QueryRegistryV2ExportsArgs,
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
