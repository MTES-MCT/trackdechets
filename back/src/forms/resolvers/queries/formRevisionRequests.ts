import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { QueryFormRevisionRequestsArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { checkIsCompanyMember } from "../../../users/permissions";

const MIN_SIZE = 0;
const MAX_SIZE = 50;

export default async function formRevisionRequests(
  _,
  {
    siret,
    after,
    first = MAX_SIZE,
    where: inputWhere = {}
  }: QueryFormRevisionRequestsArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);
  await checkIsCompanyMember({ id: user.id }, { siret });
  const company = await getCompanyOrCompanyNotFound({ siret });

  const pageSize = Math.max(Math.min(first, MAX_SIZE), MIN_SIZE);

  const { status } = inputWhere;
  const where = {
    OR: [
      { authoringCompanyId: company.id },
      { approvals: { some: { approverSiret: company.siret } } }
    ],
    ...(status && { status })
  };

  const revisionRequestsCount = await prisma.bsddRevisionRequest.count({
    where
  });
  const revisionRequests = await prisma.bsddRevisionRequest.findMany({
    take: pageSize + 1,
    ...(after && { cursor: { id: after } }),
    orderBy: { createdAt: "desc" },
    where
  });

  const edges = revisionRequests
    .map(revision => ({
      node: revision,
      cursor: revision.id
    }))
    .slice(0, pageSize);

  const pageInfo = {
    startCursor: edges[0]?.cursor || null,
    endCursor: edges[edges.length - 1]?.cursor || null,

    hasNextPage: revisionRequests.length > pageSize,
    hasPreviousPage: false
  };

  return {
    edges,
    pageInfo,
    totalCount: revisionRequestsCount
  };
}
