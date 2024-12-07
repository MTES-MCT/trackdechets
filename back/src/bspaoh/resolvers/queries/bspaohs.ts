import { expandBspaohFromDb } from "../../converter";
import { BspaohStatus } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import { GraphQLContext } from "../../../types";
import { applyMask } from "../../../common/where";
import { getConnection } from "../../../common/pagination";
import { QueryBspaohsArgs } from "@td/codegen-back";
import { toPrismaWhereInput } from "../../where";
import { Permission, can, getUserRoles } from "../../../permissions";
import { getBspaohRepository } from "../../repository";

export default async function bspaohs(
  _,
  { where: whereArgs, ...gqlPaginationArgs }: QueryBspaohsArgs,
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
      { transportersSirets: { hasSome: orgIdsWithListPermission } }
    ]
  };
  const prismaWhere = {
    ...(whereArgs ? toPrismaWhereInput(whereArgs) : {}),
    isDeleted: false,
    AND: {
      OR: [
        {
          status: BspaohStatus.DRAFT,
          canAccessDraftSirets: { hasSome: orgIdsWithListPermission }
        },
        { status: { not: BspaohStatus.DRAFT } }
      ]
    }
  };

  const where = applyMask(prismaWhere, mask);

  const bspaohRepository = getBspaohRepository(user);
  const totalCount = await bspaohRepository.count(where);

  return getConnection({
    totalCount,
    findMany: prismaPaginationArgs =>
      bspaohRepository.findMany(where, {
        include: { transporters: true },
        ...prismaPaginationArgs,
        orderBy: { rowNumber: "desc" }
      }),
    formatNode: expandBspaohFromDb,
    ...gqlPaginationArgs
  });
}
