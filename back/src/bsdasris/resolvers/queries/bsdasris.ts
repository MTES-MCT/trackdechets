import { expandBsdasriFromDB } from "../../converter";

import { checkIsAuthenticated } from "../../../common/permissions";
import { GraphQLContext } from "../../../types";
import { toPrismaWhereInput } from "../../where";
import { applyMask } from "../../../common/where";
import { getConnection } from "../../../common/pagination";
import { QueryResolvers } from "../../../generated/graphql/types";
import { getBsdasriRepository } from "../../repository";
import { Permission, can, getUserRoles } from "../../../permissions";

const bsdasrisResolver: QueryResolvers["bsdasris"] = async (
  _,
  args,
  context: GraphQLContext
) => {
  const user = checkIsAuthenticated(context);

  const { where: whereArgs, ...gqlPaginationArgs } = args;

  const roles = await getUserRoles(user.id);
  const orgIdsWithListPermission = Object.keys(roles).filter(orgId =>
    can(roles[orgId], Permission.BsdCanList)
  );

  // ensure query returns only bsds belonging to current user
  const mask = {
    OR: [
      { emitterCompanySiret: { in: orgIdsWithListPermission } },
      { transporterCompanySiret: { in: orgIdsWithListPermission } },
      { transporterCompanyVatNumber: { in: orgIdsWithListPermission } },
      { destinationCompanySiret: { in: orgIdsWithListPermission } },
      { ecoOrganismeSiret: { in: orgIdsWithListPermission } }
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
        orderBy: [{ id: "desc" }, { createdAt: "desc" }]
      }),
    formatNode: expandBsdasriFromDB,
    ...gqlPaginationArgs
  });
};

export default bsdasrisResolver;
