import { checkIsAuthenticated } from "../../../common/permissions";
import { applyMask } from "../../../common/where";
import { QueryBsvhusArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";
import { expandVhuFormFromDb } from "../../converter";
import { getConnectionsArgs } from "../../pagination";
import { toPrismaWhereInput } from "../../where";

export default async function bsvhus(
  _,
  { where: whereArgs, ...paginationArgs }: QueryBsvhusArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const defaultPaginateBy = 50;
  const itemsPerPage =
    paginationArgs.first ?? paginationArgs.last ?? defaultPaginateBy;
  const connectionsArgs = await getConnectionsArgs({
    ...paginationArgs,
    defaultPaginateBy,
    maxPaginateBy: 500
  });

  const userCompanies = await getUserCompanies(user.id);
  const userSirets = userCompanies.map(c => c.siret);

  const mask = {
    OR: [
      { emitterCompanySiret: { in: userSirets } },
      { transporterCompanySiret: { in: userSirets } },
      { destinationCompanySiret: { in: userSirets } }
    ]
  };

  const prismaWhere = {
    ...(whereArgs ? toPrismaWhereInput(whereArgs) : {}),
    isDeleted: false
  };

  const where = applyMask(prismaWhere, mask);

  const totalCount = await prisma.bsvhu.count({ where });
  const queriedForms = await prisma.bsvhu.findMany({
    ...connectionsArgs,
    orderBy: { createdAt: "desc" },
    where
  });

  const edges = queriedForms
    .slice(0, itemsPerPage)
    .map(f => ({ cursor: f.id, node: expandVhuFormFromDb(f) }));
  return {
    totalCount,
    edges,
    pageInfo: {
      startCursor: edges[0]?.cursor,
      endCursor: edges[edges.length - 1]?.cursor,
      hasNextPage: paginationArgs.after
        ? queriedForms.length > itemsPerPage
        : false,
      hasPreviousPage: paginationArgs.before
        ? queriedForms.length > itemsPerPage
        : false
    }
  };
}
