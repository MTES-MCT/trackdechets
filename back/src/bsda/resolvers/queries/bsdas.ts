import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryBsdasArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { expandBsdaFromDb } from "../../converter";
import { toPrismaWhereInput } from "../../where";
import { applyMask } from "../../../common/where";
import { BSDA_CONTRIBUTORS_FIELDS } from "../../permissions";
import { getConnection } from "../../../common/pagination";
import { getCachedUserSiretOrVat } from "../../../common/redis/users";
import { getBsdaRepository } from "../../repository";

export default async function bsdas(
  _,
  { where: whereArgs, ...gqlPaginationArgs }: QueryBsdasArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const userCompaniesSiretOrVat = await getCachedUserSiretOrVat(user.id);

  const mask = {
    OR: [
      ...Object.values(BSDA_CONTRIBUTORS_FIELDS).map(field => ({
        [field]: { in: userCompaniesSiretOrVat }
      })),
      { intermediaries: { some: { siret: { in: userCompaniesSiretOrVat } } } }
    ]
  };

  const prismaWhere = {
    ...(whereArgs ? toPrismaWhereInput(whereArgs) : {}),
    isDeleted: false
  };

  const where = applyMask(prismaWhere, mask);
  const bsdaRepository = getBsdaRepository(user);
  const totalCount = await bsdaRepository.count(where);

  return getConnection({
    totalCount,
    findMany: prismaPaginationArgs =>
      bsdaRepository.findMany(where, {
        ...prismaPaginationArgs,
        orderBy: { createdAt: "desc" }
      }),
    formatNode: expandBsdaFromDb,
    ...gqlPaginationArgs
  });
}
