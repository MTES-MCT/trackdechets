import { QueryResolvers } from "@td/codegen-back";
import { expandBsffFromDB } from "../../converter";
import { checkIsAuthenticated } from "../../../common/permissions";
import { toPrismaBsffWhereInput } from "../../where";
import { applyMask } from "../../../common/where";
import { getConnection } from "../../../common/pagination";
import { Prisma } from "@prisma/client";
import { getReadonlyBsffRepository } from "../../repository";
import { Permission, can, getUserRoles } from "../../../permissions";

const bsffs: QueryResolvers["bsffs"] = async (
  _,
  { where: whereArgs, ...gqlPaginationArgs },
  context
) => {
  const user = checkIsAuthenticated(context);

  const roles = await getUserRoles(user.id);
  const orgIdsWithListPermission = Object.keys(roles).filter(orgId =>
    can(roles[orgId], Permission.BsdCanList)
  );

  const orgMask = {
    OR: [
      { emitterCompanySiret: { in: orgIdsWithListPermission } },
      { transportersOrgIds: { hasSome: orgIdsWithListPermission } },
      { destinationCompanySiret: { in: orgIdsWithListPermission } },
      { detenteurCompanySirets: { hasSome: orgIdsWithListPermission } }
    ]
  };

  const mask: Prisma.Enumerable<Prisma.BsffWhereInput> = {
    OR: [
      {
        isDraft: false,
        ...orgMask
      },
      {
        isDraft: true,
        canAccessDraftOrgIds: { hasSome: orgIdsWithListPermission },
        ...orgMask
      }
    ]
  };

  const prismaWhere: Prisma.BsffWhereInput = {
    ...(whereArgs ? toPrismaBsffWhereInput(whereArgs) : {}),
    isDeleted: false
  };

  const where = applyMask(prismaWhere, mask);

  const { count: countBsff, findMany: findManyBsff } =
    getReadonlyBsffRepository();

  const totalCount = await countBsff({ where });

  return getConnection({
    totalCount,
    findMany: prismaPaginationArgs =>
      findManyBsff({
        where,
        ...prismaPaginationArgs,
        orderBy: { rowNumber: "desc" },
        include: { transporters: true }
      }),
    formatNode: bsff => expandBsffFromDB(bsff),
    ...gqlPaginationArgs
  });
};

export default bsffs;
