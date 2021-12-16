import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryBsdasArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";
import { expandBsdaFromDb } from "../../converter";
import { toPrismaWhereInput } from "../../where";
import { applyMask } from "../../../common/where";
import { BSDA_CONTRIBUTORS_FIELDS } from "../../permissions";
import { getPrismaPaginationArgs } from "../../../common/pagination";

export default async function bsdas(
  _,
  { where: whereArgs, ...connectionArgs }: QueryBsdasArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const defaultPaginateBy = 50;

  const paginationArgs = getPrismaPaginationArgs({
    ...connectionArgs,
    defaultPaginateBy,
    maxPaginateBy: 500
  });

  const itemsPerPage = Math.abs(paginationArgs.take) - 1;

  const userCompanies = await getUserCompanies(user.id);
  const userSirets = userCompanies.map(c => c.siret);

  const mask = {
    OR: Object.values(BSDA_CONTRIBUTORS_FIELDS).map(field => ({
      [field]: { in: userSirets }
    }))
  };

  const prismaWhere = {
    ...(whereArgs ? toPrismaWhereInput(whereArgs) : {}),
    isDeleted: false
  };

  const where = applyMask(prismaWhere, mask);

  const totalCount = await prisma.bsda.count({ where });
  const queriedForms = await prisma.bsda.findMany({
    ...paginationArgs,
    orderBy: { createdAt: "desc" },
    where
  });

  const edges = queriedForms
    .slice(0, itemsPerPage)
    .map(f => ({ cursor: f.id, node: expandBsdaFromDb(f) }));
  return {
    totalCount,
    edges,
    pageInfo: {
      startCursor: edges[0]?.cursor,
      endCursor: edges[edges.length - 1]?.cursor,
      hasNextPage: connectionArgs.after
        ? queriedForms.length > itemsPerPage
        : false,
      hasPreviousPage: connectionArgs.before
        ? queriedForms.length > itemsPerPage
        : false
    }
  };
}
