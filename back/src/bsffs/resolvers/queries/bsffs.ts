import prisma from "../../../prisma";
import { QueryResolvers } from "../../../generated/graphql/types";
import { unflattenBsff } from "../../converter";
import { checkIsAuthenticated } from "../../../common/permissions";
import { toPrismaWhereInput } from "../../where";
import { applyMask } from "../../../common/where";
import { getConnection } from "../../../common/pagination";
import { getCachedUserSirets } from "../../../common/redis/users"

const bsffs: QueryResolvers["bsffs"] = async (
  _,
  { where: whereArgs, ...gqlPaginationArgs },
  context
) => {
  const user = checkIsAuthenticated(context);

  const sirets = await getCachedUserSirets(user.id);

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

  const totalCount = await prisma.bsff.count({ where });

  return getConnection({
    totalCount,
    findMany: prismaPaginationArgs =>
      prisma.bsff.findMany({
        where,
        ...prismaPaginationArgs,
        orderBy: { createdAt: "desc" }
      }),
    formatNode: unflattenBsff,
    ...gqlPaginationArgs
  });
};

export default bsffs;
