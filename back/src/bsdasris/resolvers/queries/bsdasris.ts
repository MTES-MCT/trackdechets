import { expandBsdasriFromDB } from "../../converter";
import prisma from "../../../prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import { GraphQLContext } from "../../../types";
import { toPrismaWhereInput } from "../../where";
import { applyMask } from "../../../common/where";
import { getCachedUserSirets } from "../../../common/redis/users";
import { getConnection } from "../../../common/pagination";
import { QueryResolvers } from "../../../generated/graphql/types";

const bsdasrisResolver: QueryResolvers["bsdasris"] = async (
  _,
  args,
  context: GraphQLContext
) => {
  const user = checkIsAuthenticated(context);

  const { where: whereArgs, ...gqlPaginationArgs } = args;

  const sirets = await getCachedUserSirets(user.id);
  // ensure query returns only bsds belonging to current user
  const mask = {
    OR: [
      { emitterCompanySiret: { in: sirets } },
      { transporterCompanySiret: { in: sirets } },
      { destinationCompanySiret: { in: sirets } }
    ]
  };

  const prismaWhere = {
    ...(whereArgs ? toPrismaWhereInput(whereArgs) : {}),
    isDeleted: false
  };

  const where = applyMask(prismaWhere, mask);

  const totalCount = await prisma.bsdasri.count({ where });

  return getConnection({
    totalCount,
    findMany: prismaPaginationArgs =>
      prisma.bsdasri.findMany({
        where,
        ...prismaPaginationArgs,
        orderBy: { createdAt: "desc" }
      }),
    formatNode: expandBsdasriFromDB,
    ...gqlPaginationArgs
  });
};

export default bsdasrisResolver;
