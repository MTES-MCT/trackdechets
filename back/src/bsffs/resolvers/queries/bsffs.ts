import prisma from "../../../prisma";
import { QueryResolvers } from "../../../generated/graphql/types";
import { expandBsffFromDB } from "../../converter";
import { checkIsAuthenticated } from "../../../common/permissions";
import { toPrismaBsffWhereInput } from "../../where";
import { applyMask } from "../../../common/where";
import { getConnection } from "../../../common/pagination";
import { getCachedUserSiretOrVat } from "../../../common/redis/users";
import { Prisma } from "@prisma/client";

const bsffs: QueryResolvers["bsffs"] = async (
  _,
  { where: whereArgs, ...gqlPaginationArgs },
  context
) => {
  const user = checkIsAuthenticated(context);

  const userCompaniesSiretOrVat = await getCachedUserSiretOrVat(user.id);

  const mask: Prisma.Enumerable<Prisma.BsffWhereInput> = {
    OR: [
      { emitterCompanySiret: { in: userCompaniesSiretOrVat } },
      { transporterCompanySiret: { in: userCompaniesSiretOrVat } },
      { transporterCompanyVatNumber: { in: userCompaniesSiretOrVat } },
      { destinationCompanySiret: { in: userCompaniesSiretOrVat } },
      { detenteurCompanySirets: { hasSome: userCompaniesSiretOrVat } }
    ]
  };

  const prismaWhere: Prisma.BsffWhereInput = {
    ...(whereArgs ? toPrismaBsffWhereInput(whereArgs) : {}),
    isDeleted: false
  };

  const where = applyMask(prismaWhere, mask);

  const totalCount = await prisma.bsff.count({ where });

  return getConnection({
    totalCount,
    findMany: prismaPaginationArgs =>
      prisma.bsff.findMany({
        where,
        ...prismaPaginationArgs,
        orderBy: { createdAt: "desc" }
      }),
    formatNode: expandBsffFromDB,
    ...gqlPaginationArgs
  });
};

export default bsffs;
