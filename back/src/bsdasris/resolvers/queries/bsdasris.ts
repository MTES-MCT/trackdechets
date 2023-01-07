import { expandBsdasriFromDB } from "../../converter";

import { checkIsAuthenticated } from "../../../common/permissions";
import { GraphQLContext } from "../../../types";
import { toPrismaWhereInput } from "../../where";
import { applyMask } from "../../../common/where";
import { getCachedUserSiretOrVat } from "../../../common/redis/users";
import { getConnection } from "../../../common/pagination";
import { QueryResolvers } from "../../../generated/graphql/types";
import { getBsdasriRepository } from "../../repository";

const bsdasrisResolver: QueryResolvers["bsdasris"] = async (
  _,
  args,
  context: GraphQLContext
) => {
  const user = checkIsAuthenticated(context);

  const { where: whereArgs, ...gqlPaginationArgs } = args;

  const userCompaniesSiretOrVat = await getCachedUserSiretOrVat(user.id);
  // ensure query returns only bsds belonging to current user
  const mask = {
    OR: [
      { emitterCompanySiret: { in: userCompaniesSiretOrVat } },
      { transporterCompanySiret: { in: userCompaniesSiretOrVat } },
      { transporterCompanyVatNumber: { in: userCompaniesSiretOrVat } },
      { destinationCompanySiret: { in: userCompaniesSiretOrVat } },
      { ecoOrganismeSiret: { in: userCompaniesSiretOrVat } }
    ]
  };

  const prismaWhere = {
    ...(whereArgs ? toPrismaWhereInput(whereArgs) : {}),
    isDeleted: false
  };

  const where = applyMask(prismaWhere, mask);

  const bsdasriRepository = getBsdasriRepository(user);

  const totalCount = await bsdasriRepository.count(where);

  return getConnection({
    totalCount,
    findMany: prismaPaginationArgs =>
      bsdasriRepository.findMany(where, {
        ...prismaPaginationArgs,
        orderBy: { createdAt: "desc" }
      }),
    formatNode: expandBsdasriFromDB,
    ...gqlPaginationArgs
  });
};

export default bsdasrisResolver;
