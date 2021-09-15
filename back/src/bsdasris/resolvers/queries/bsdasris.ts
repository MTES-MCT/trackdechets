import { unflattenBsdasri } from "../../converter";

import prisma from "../../../prisma";
import { checkIsAuthenticated } from "../../../common/permissions";

import { getCursorConnectionsArgs } from "../../cursorPagination";

import { GraphQLContext } from "../../../types";
import { buildDbFilter } from "./where";
const defaultPaginateBy = 50;
import { getUserCompanies } from "../../../users/database";

export default async function dasris(_, args, context: GraphQLContext) {
  const user = checkIsAuthenticated(context);

  const { where: whereArgs, ...paginationArgs } = args;

  const itemsPerPage =
    paginationArgs.first ?? paginationArgs.last ?? defaultPaginateBy;
  const { requiredItems, ...connectionsArgs } = await getCursorConnectionsArgs({
    ...paginationArgs,
    defaultPaginateBy: itemsPerPage,
    maxPaginateBy: 500
  });

  const userCompanies = await getUserCompanies(user.id);
  const userSirets = userCompanies.map(c => c.siret);

  const where = {
    ...buildDbFilter(whereArgs, userSirets),
    isDeleted: false
  };
  const queried = await prisma.bsdasri.findMany({
    ...connectionsArgs,
    orderBy: { createdAt: "desc" },

    where
  });
  const totalCount = await prisma.bsdasri.count({ where });
  const queriedCount = queried.length;

  const expanded = queried.map(f => unflattenBsdasri(f));
  const pageInfo = {
    startCursor: expanded[0]?.id || "",
    endCursor: expanded[queriedCount - 1]?.id || "",
    hasNextPage:
      paginationArgs.after | paginationArgs.first
        ? queriedCount > requiredItems
        : false,
    hasPreviousPage:
      paginationArgs.before | paginationArgs.last
        ? queriedCount > requiredItems
        : false
  };
  return {
    totalCount,
    edges: expanded.map(bsd => ({ cursor: bsd.id, node: bsd })),
    pageInfo
  };
}
