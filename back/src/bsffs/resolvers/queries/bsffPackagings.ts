import prisma from "../../../prisma";
import { QueryResolvers } from "../../../generated/graphql/types";
import { expandBsffPackagingFromDB } from "../../converter";
import { checkIsAuthenticated } from "../../../common/permissions";
import { toPrismaBsffPackagingWhereInput } from "../../where";
import { applyMask } from "../../../common/where";
import { getConnection } from "../../../common/pagination";
import { getCachedUserSiretOrVat } from "../../../common/redis/users";
import { Prisma } from "@prisma/client";

const bsffPackagings: QueryResolvers["bsffPackagings"] = async (
  _,
  { where: whereArgs, ...gqlPaginationArgs },
  context
) => {
  const user = checkIsAuthenticated(context);

  const userCompaniesSiretOrVat = await getCachedUserSiretOrVat(user.id);

  const mask = {
    bsff: {
      OR: [
        { emitterCompanySiret: { in: userCompaniesSiretOrVat } },
        { transporterCompanySiret: { in: userCompaniesSiretOrVat } },
        { transporterCompanyVatNumber: { in: userCompaniesSiretOrVat } },
        { destinationCompanySiret: { in: userCompaniesSiretOrVat } }
      ]
    }
  };

  const prismaWhere = {
    ...(whereArgs ? toPrismaBsffPackagingWhereInput(whereArgs) : {})
  };

  const where: Prisma.BsffPackagingWhereInput = applyMask(prismaWhere, mask);

  const totalCount = await prisma.bsffPackaging.count({ where });

  return getConnection({
    totalCount,
    findMany: prismaPaginationArgs =>
      prisma.bsffPackaging.findMany({
        where,
        ...prismaPaginationArgs,
        orderBy: { bsff: { createdAt: "desc" } }
      }),
    formatNode: expandBsffPackagingFromDB,
    ...gqlPaginationArgs
  });
};

export default bsffPackagings;
