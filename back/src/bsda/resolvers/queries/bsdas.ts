import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryBsdasArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";
import { getConnectionsArgs } from "../../../vhu/pagination";
import { expandBsdaFormFromDb } from "../../converter";
import { convertWhereToDbFilter } from "../../where";

export default async function bsdas(
  _,
  { where: whereArgs, ...paginationArgs }: QueryBsdasArgs,
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

  const where = {
    ...convertWhereToDbFilter(whereArgs),
    OR: [
      { emitterCompanySiret: { in: userSirets } },
      { workerCompanySiret: { in: userSirets } },
      { transporterCompanySiret: { in: userSirets } },
      { destinationCompanySiret: { in: userSirets } }
    ],
    isDeleted: false
  };

  const totalCount = await prisma.bsda.count({ where });
  const queriedForms = await prisma.bsda.findMany({
    ...connectionsArgs,
    orderBy: { createdAt: "desc" },
    where
  });

  const edges = queriedForms
    .slice(0, itemsPerPage)
    .map(f => ({ cursor: f.id, node: expandBsdaFormFromDb(f) }));
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
