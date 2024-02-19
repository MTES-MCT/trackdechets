import { QueryResolvers } from "../../../generated/graphql/types";
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

  const mask: Prisma.Enumerable<Prisma.BsffWhereInput> = {
    OR: [
      { emitterCompanySiret: { in: orgIdsWithListPermission } },
      { transporterCompanySiret: { in: orgIdsWithListPermission } },
      { transporterCompanyVatNumber: { in: orgIdsWithListPermission } },
      { destinationCompanySiret: { in: orgIdsWithListPermission } },
      { detenteurCompanySirets: { hasSome: orgIdsWithListPermission } }
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
        orderBy: [{ id: "desc" }, { createdAt: "desc" }]
      }),
    formatNode: expandBsffFromDB,
    ...gqlPaginationArgs
  });
};

export default bsffs;
