import { getConnection } from "../../../common/pagination";
import { checkIsAuthenticated } from "../../../common/permissions";
import { applyMask } from "../../../common/where";
import { QueryBsvhusArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { getCachedUserSiretOrVat } from "../../../common/redis/users";
import { expandVhuFormFromDb } from "../../converter";
import { getReadonlyBsvhuRepository } from "../../repository";

import { toPrismaWhereInput } from "../../where";

export default async function bsvhus(
  _,
  { where: whereArgs, ...gqlPaginationArgs }: QueryBsvhusArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const userCompaniesSiretOrVat = await getCachedUserSiretOrVat(user.id);

  const mask = {
    OR: [
      { emitterCompanySiret: { in: userCompaniesSiretOrVat } },
      { transporterCompanySiret: { in: userCompaniesSiretOrVat } },
      { destinationCompanySiret: { in: userCompaniesSiretOrVat } }
    ]
  };

  const prismaWhere = {
    ...(whereArgs ? toPrismaWhereInput(whereArgs) : {}),
    isDeleted: false
  };

  const where = applyMask(prismaWhere, mask);
  const bsvhuRepository = getReadonlyBsvhuRepository();
  const totalCount = await bsvhuRepository.count(where);

  return getConnection({
    totalCount,
    findMany: prismaPaginationArgs =>
      bsvhuRepository.findMany(where, {
        ...prismaPaginationArgs,
        orderBy: { createdAt: "desc" }
      }),
    formatNode: expandVhuFormFromDb,
    ...gqlPaginationArgs
  });
}
