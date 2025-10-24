import { getConnection } from "../../../common/pagination";
import { checkIsAuthenticated } from "../../../common/permissions";
import { applyMask } from "../../../common/where";
import type { QueryBsvhusArgs } from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { expandVhuFormFromDb } from "../../converter";
import { getReadonlyBsvhuRepository } from "../../repository";

import { toPrismaWhereInput } from "../../where";
import { Permission, can, getUserRoles } from "../../../permissions";
import { Prisma } from "@td/prisma";

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
      { transportersOrgIds: { hasSome: orgIdsWithListPermission } },
      { destinationCompanySiret: { in: orgIdsWithListPermission } },
      { brokerCompanySiret: { in: orgIdsWithListPermission } },
      { traderCompanySiret: { in: orgIdsWithListPermission } },
      { intermediariesOrgIds: { hasSome: orgIdsWithListPermission } }
    ]
  };

  const draftMask: Prisma.BsvhuWhereInput = {
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
  const where = applyMask<Prisma.BsvhuWhereInput>(prismaWhere, draftMask);
  const bsvhuRepository = getReadonlyBsvhuRepository();
  const totalCount = await bsvhuRepository.count(where);

  return getConnection({
    totalCount,
    findMany: prismaPaginationArgs =>
      bsvhuRepository.findMany(where, {
        ...prismaPaginationArgs,
        orderBy: { rowNumber: "desc" },
        include: { transporters: true }
      }),
    formatNode: expandVhuFormFromDb,
    ...gqlPaginationArgs
  });
}
