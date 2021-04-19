import { MissingSiret } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { QueryBsvhusArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { checkIsCompanyMember } from "../../../users/permissions";
import { expandVhuFormFromDb } from "../../converter";
import { getConnectionsArgs } from "../../pagination";
import { convertWhereToDbFilter } from "../../where";

export default async function bsvhus(
  _,
  { where: whereArgs, siret, ...paginationArgs }: QueryBsvhusArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const company = await getRequestCompany(user, siret);
  if (!company) {
    return {
      totalCount: 0,
      edges: [],
      pageInfo: {
        startCursor: "",
        endCursor: "",
        hasNextPage: false,
        hasPreviousPage: false
      }
    };
  }

  const defaultPaginateBy = 50;
  const itemsPerPage =
    paginationArgs.first ?? paginationArgs.last ?? defaultPaginateBy;
  const connectionsArgs = await getConnectionsArgs({
    ...paginationArgs,
    defaultPaginateBy,
    maxPaginateBy: 500
  });

  const where = {
    ...convertWhereToDbFilter(whereArgs),
    OR: [
      { emitterCompanySiret: siret },
      { transporterCompanySiret: siret },
      { destinationCompanySiret: siret }
    ],
    isDeleted: false
  };

  const totalCount = await prisma.bsvhuForm.count({ where });
  const queriedForms = await prisma.bsvhuForm.findMany({
    ...connectionsArgs,
    orderBy: { createdAt: "desc" },
    where
  });

  const edges = queriedForms
    .slice(0, itemsPerPage)
    .map(f => ({ cursor: f.id, node: expandVhuFormFromDb(f) }));
  return {
    totalCount,
    edges,
    pageInfo: {
      startCursor: edges[0]?.cursor,
      endCursor: edges[edges.length - 1]?.cursor,
      hasNextPage: paginationArgs.after
        ? queriedForms.length > itemsPerPage
        : false,
      hasPreviousPage: paginationArgs.before
        ? queriedForms.length > itemsPerPage
        : false
    }
  };
}

async function getRequestCompany(user: Express.User, siret: string) {
  if (!siret) {
    throw new MissingSiret();
  }

  await checkIsCompanyMember({ id: user.id }, { siret });
  return getCompanyOrCompanyNotFound({ siret });
}
