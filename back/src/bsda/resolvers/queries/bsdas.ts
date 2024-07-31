import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryBsdasArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { expandBsdaFromDb } from "../../converter";
import { toPrismaWhereInput } from "../../where";
import { applyMask } from "../../../common/where";
import { getConnection } from "../../../common/pagination";
import { getBsdaRepository } from "../../repository";
import { Permission, can, getUserRoles } from "../../../permissions";
import { BsdaStatus, Prisma } from "@prisma/client";

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

  const mask: Prisma.BsdaWhereInput = {
    OR: [
      { emitterCompanySiret: { in: orgIdsWithListPermission } },
      { destinationCompanySiret: { in: orgIdsWithListPermission } },
      { workerCompanySiret: { in: orgIdsWithListPermission } },
      { transportersOrgIds: { hasSome: orgIdsWithListPermission } },
      { brokerCompanySiret: { in: orgIdsWithListPermission } },
      {
        destinationOperationNextDestinationCompanySiret: {
          in: orgIdsWithListPermission
        }
      },
      { intermediariesOrgIds: { hasSome: orgIdsWithListPermission } }
    ]
  };

  const draftMask: Prisma.BsdaWhereInput = {
    OR: [
      {
        status: { not: BsdaStatus.INITIAL },
        ...mask
      },
      {
        status: BsdaStatus.INITIAL,
        canAccessDraftOrgIds: { hasSome: orgIdsWithListPermission },
        ...mask
      }
    ]
  };

  const prismaWhere = {
    ...(whereArgs ? toPrismaWhereInput(whereArgs) : {}),
    isDeleted: false
  };

  const where = applyMask<Prisma.BsdaWhereInput>(prismaWhere, draftMask);
  const bsdaRepository = getBsdaRepository(user);
  const totalCount = await bsdaRepository.count(where);

  return getConnection({
    totalCount,
    findMany: prismaPaginationArgs =>
      bsdaRepository.findMany(where, {
        ...prismaPaginationArgs,
        orderBy: { rowNumber: "desc" },
        include: { transporters: true }
      }),
    formatNode: expandBsdaFromDb,
    ...gqlPaginationArgs
  });
}
