import { getConnection } from "../../../common/pagination";
import { checkIsAuthenticated } from "../../../common/permissions";
import { applyMask } from "../../../common/where";
import { QueryBsvhusArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { expandVhuFormFromDb } from "../../converter";
import { getReadonlyBsvhuRepository } from "../../repository";

import { toPrismaWhereInput } from "../../where";
import { Permission, can, getUserRoles } from "../../../permissions";

export default async function bsvhus(
  _,
  { where: whereArgs, ...gqlPaginationArgs }: QueryBsvhusArgs,
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
      { transporterCompanySiret: { in: orgIdsWithListPermission } },
      { transporterCompanyVatNumber: { in: orgIdsWithListPermission } },
      { destinationCompanySiret: { in: orgIdsWithListPermission } }
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
        orderBy: { rowNumber: "desc" }
      }),
    formatNode: expandVhuFormFromDb,
    ...gqlPaginationArgs
  });
}
