import type { QueryResolvers } from "@td/codegen-back";
import { expandBsffPackagingFromDB } from "../../converter";
import { checkIsAuthenticated } from "../../../common/permissions";
import { toPrismaBsffPackagingWhereInput } from "../../where";
import { applyMask } from "../../../common/where";
import { getConnection } from "../../../common/pagination";
import { Prisma } from "@td/prisma";
import { getBsffPackagingRepository } from "../../repository";
import { Permission, can, getUserRoles } from "../../../permissions";

const bsffPackagings: QueryResolvers["bsffPackagings"] = async (
  _,
  { where: whereArgs, ...gqlPaginationArgs },
  context
) => {
  const user = checkIsAuthenticated(context);

  const roles = await getUserRoles(user.id);
  const orgIdsWithListPermission = Object.keys(roles).filter(orgId =>
    can(roles[orgId], Permission.BsdCanList)
  );

  const mask = {
    bsff: {
      OR: [
        { emitterCompanySiret: { in: orgIdsWithListPermission } },
        { transportersOrgIds: { hasSome: orgIdsWithListPermission } },
        { destinationCompanySiret: { in: orgIdsWithListPermission } }
      ]
    }
  };

  const prismaWhere = {
    ...(whereArgs ? toPrismaBsffPackagingWhereInput(whereArgs) : {})
  };

  const where: Prisma.BsffPackagingWhereInput = applyMask(prismaWhere, mask);

  const { count: countPackagings, findMany: findManyPackagings } =
    getBsffPackagingRepository(user);

  const totalCount = await countPackagings({ where });

  return getConnection({
    totalCount,
    findMany: prismaPaginationArgs =>
      findManyPackagings({
        where,
        ...prismaPaginationArgs,
        orderBy: { bsff: { createdAt: "desc" } }
      }),
    formatNode: expandBsffPackagingFromDB,
    ...gqlPaginationArgs
  });
};

export default bsffPackagings;
