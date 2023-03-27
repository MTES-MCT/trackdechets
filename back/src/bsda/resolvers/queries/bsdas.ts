import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryBsdasArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { expandBsdaFromDb } from "../../converter";
import { toPrismaWhereInput } from "../../where";
import { applyMask } from "../../../common/where";
import { getConnection } from "../../../common/pagination";
import { getBsdaRepository } from "../../repository";
import { Permission, can, getUserRoles } from "../../../permissions";

export default async function bsdas(
  _,
  { where: whereArgs, ...gqlPaginationArgs }: QueryBsdasArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const roles = await getUserRoles(user.id);
  const orgIdsWithListPermission = Object.keys(roles).filter(orgId =>
    can(roles[orgId], Permission.BsdCanList)
  );

  const mask = {
    OR: [
      { emitterCompanySiret: { in: orgIdsWithListPermission } },
      { destinationCompanySiret: { in: orgIdsWithListPermission } },
      { transporterCompanySiret: { in: orgIdsWithListPermission } },
      { transporterCompanyVatNumber: { in: orgIdsWithListPermission } },
      { workerCompanySiret: { in: orgIdsWithListPermission } },
      { brokerCompanySiret: { in: orgIdsWithListPermission } },
      {
        destinationOperationNextDestinationCompanySiret: {
          in: orgIdsWithListPermission
        }
      },
      { intermediariesOrgIds: { hasSome: orgIdsWithListPermission } }
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
