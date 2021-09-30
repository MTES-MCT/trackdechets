import prisma from "../../../prisma";
import { QueryResolvers } from "../../../generated/graphql/types";
import { unflattenBsff } from "../../converter";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getConnectionsArgs } from "../../../bsvhu/pagination";
import { toPrismaWhereInput } from "../../where";
import { applyMask } from "../../../common/where";
import { getUserCompanies } from "../../../users/database";

const bsffs: QueryResolvers["bsffs"] = async (_, args, context) => {
  const user = checkIsAuthenticated(context);

  const companies = await getUserCompanies(user.id);
  const sirets = companies.map(company => company.siret);

  const mask = {
    OR: [
      { emitterCompanySiret: { in: sirets } },
      { transporterCompanySiret: { in: sirets } },
      { destinationCompanySiret: { in: sirets } }
    ]
  };

  const prismaWhere = {
    ...(args.where ? toPrismaWhereInput(args.where) : {}),
    isDeleted: false
  };

  const where = applyMask(prismaWhere, mask);

  const totalCount = await prisma.bsff.count({ where });
  const paginationArgs = await getConnectionsArgs({
    after: args.after,
    first: args.first,
    before: args.before,
    last: args.last
  });
  const bsffs = await prisma.bsff.findMany({
    ...paginationArgs,
    where,
    orderBy: { updatedAt: "desc" }
  });

  return {
    edges: bsffs.map(bsff => ({
      node: unflattenBsff(bsff),
      cursor: bsff.id
    })),
    totalCount,
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false
    }
  };
};

export default bsffs;
