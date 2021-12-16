import { unflattenBsdasri } from "../../converter";
import prisma from "../../../prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import { GraphQLContext } from "../../../types";
import { toPrismaWhereInput } from "../../where";
import { applyMask } from "../../../common/where";
import { getUserCompanies } from "../../../users/database";
import { getPrismaPaginationArgs } from "../../../common/pagination";

export default async function dasris(_, args, context: GraphQLContext) {
  const user = checkIsAuthenticated(context);

  const { where: whereArgs, ...connectionsArgs } = args;

  const paginationArgs = getPrismaPaginationArgs({
    ...connectionsArgs,
    defaultPaginateBy: 50,
    maxPaginateBy: 500
  });

  const itemsPerPage = Math.abs(paginationArgs.take) - 1;

  const requiredItems = Math.abs(
    args.first || args.last || args.defaultPaginateBy
  );

  const userCompanies = await getUserCompanies(user.id);
  const userSirets = userCompanies.map(c => c.siret);
  // ensure query returns only bsds belonging to current user
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

  const queried = await prisma.bsdasri.findMany({
    ...paginationArgs,
    orderBy: { createdAt: "desc" },
    where
  });
  const totalCount = await prisma.bsdasri.count({ where });
  const queriedCount = queried.length;

  const expanded = queried.slice(0, itemsPerPage).map(f => unflattenBsdasri(f));
  const pageInfo = {
    startCursor: expanded[0]?.id || "",
    endCursor: expanded[queriedCount - 1]?.id || "",
    hasNextPage:
      connectionsArgs.after | connectionsArgs.first
        ? queriedCount > requiredItems
        : false,
    hasPreviousPage:
      connectionsArgs.before | connectionsArgs.last
        ? queriedCount > requiredItems
        : false
  };
  return {
    totalCount,
    edges: expanded.map(bsd => ({ cursor: bsd.id, node: bsd })),
    pageInfo
  };
}
