import { unflattenBsdasri } from "../../converter";
import prisma from "../../../prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import { GraphQLContext } from "../../../types";
import { toPrismaWhereInput } from "../../where";
import { applyMask } from "../../../common/where";
import { getUserCompanies } from "../../../users/database";
import { getConnection } from "../../../common/pagination";
import { QueryResolvers } from "../../../generated/graphql/types";

const bsdasrisResolver: QueryResolvers["bsdasris"] = async (
  _,
  args,
  context: GraphQLContext
) => {
  const user = checkIsAuthenticated(context);

  const { where: whereArgs, ...gqlPaginationArgs } = args;

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

  const totalCount = await prisma.bsdasri.count({ where });

  return getConnection({
    totalCount,
    findMany: prismaPaginationArgs =>
      prisma.bsdasri.findMany({
        where,
        ...prismaPaginationArgs,
        orderBy: { createdAt: "desc" }
      }),
    formatNode: unflattenBsdasri,
    ...gqlPaginationArgs
  });
};

export default bsdasrisResolver;
