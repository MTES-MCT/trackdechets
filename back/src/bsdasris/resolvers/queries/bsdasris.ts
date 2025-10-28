import { Prisma } from "@td/prisma";
import { expandBsdasriFromDB } from "../../converter";

import { checkIsAuthenticated } from "../../../common/permissions";
import { GraphQLContext } from "../../../types";
import { toPrismaWhereInput } from "../../where";
import { applyMask } from "../../../common/where";
import { getConnection } from "../../../common/pagination";
import type { QueryResolvers } from "@td/codegen-back";
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
      { ecoOrganismeSiret: { in: orgIdsWithListPermission } },
      { brokerCompanySiret: { in: orgIdsWithListPermission } },
      { traderCompanySiret: { in: orgIdsWithListPermission } },
      { intermediariesOrgIds: { hasSome: orgIdsWithListPermission } }
    ]
  };

  const draftMask: Prisma.BsdasriWhereInput = {
    OR: [
      {
        isDraft: false,
        ...mask
      },
      {
        isDraft: true,
        canAccessDraftOrgIds: { hasSome: orgIdsWithListPermission },
        ...mask
      }
    ]
  };

  const prismaWhere = {
    ...(whereArgs ? toPrismaWhereInput(whereArgs) : {}),
    isDeleted: false
  };

  const where = applyMask<Prisma.BsdasriWhereInput>(prismaWhere, draftMask);

  const bsdasriRepository = getBsdasriRepository(user);

  const totalCount = await bsdasriRepository.count(where);

  return getConnection({
    totalCount,
    findMany: prismaPaginationArgs =>
      bsdasriRepository.findMany(where, {
        ...prismaPaginationArgs,
        orderBy: { rowNumber: "desc" }
      }),
    formatNode: expandBsdasriFromDB,
    ...gqlPaginationArgs
  });
};

export default bsdasrisResolver;
