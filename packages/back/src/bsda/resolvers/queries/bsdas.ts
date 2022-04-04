import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryBsdasArgs } from "@trackdechets/codegen/src/back.gen";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { expandBsdaFromDb } from "../../converter";
import { toPrismaWhereInput } from "../../where";
import { applyMask } from "../../../common/where";
import { BSDA_CONTRIBUTORS_FIELDS } from "../../permissions";
import { getConnection } from "../../../common/pagination";
import { getCachedUserSirets } from "../../../common/redis/users";

export default async function bsdas(
  _,
  { where: whereArgs, ...gqlPaginationArgs }: QueryBsdasArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const userSirets = await getCachedUserSirets(user.id);

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

  return getConnection({
    totalCount,
    findMany: prismaPaginationArgs =>
      prisma.bsda.findMany({
        where,
        ...prismaPaginationArgs,
        orderBy: { createdAt: "desc" }
      }),
    formatNode: expandBsdaFromDb,
    ...gqlPaginationArgs
  });
}
