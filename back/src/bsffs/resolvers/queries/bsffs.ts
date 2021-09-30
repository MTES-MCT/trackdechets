import prisma from "../../../prisma";
import { QueryResolvers } from "../../../generated/graphql/types";
import { unflattenBsff } from "../../converter";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getUserCompanies } from "../../../users/database";
import { getConnectionsArgs } from "../../../bsvhu/pagination";
import { toPrismaWhereInput } from "../../where";

const bsffs: QueryResolvers["bsffs"] = async (_, args, context) => {
  const user = checkIsAuthenticated(context);
  const companies = await getUserCompanies(user.id);
  const sirets = companies.map(company => company.siret);

  const where = {
    ...(args.where ? toPrismaWhereInput(args.where) : {}),
    OR: [
      { emitterCompanySiret: { in: sirets } },
      { transporterCompanySiret: { in: sirets } },
      { destinationCompanySiret: { in: sirets } }
    ],
    isDeleted: false
  };
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
