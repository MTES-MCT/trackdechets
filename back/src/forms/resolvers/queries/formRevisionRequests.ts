import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { QueryFormRevisionRequestsArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { getConnection } from "../../../common/pagination";
import { checkUserPermissions, Permission } from "../../../permissions";

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

  await checkUserPermissions(
    user,
    [siret].filter(Boolean),
    Permission.BsdCanList,
    `Vous n'êtes pas membre de l'entreprise portant le siret "${siret}".`
  );
  // TODO support orgId instead of siret for foreign companies
  const company = await getCompanyOrCompanyNotFound({ siret });

  const pageSize = Math.max(Math.min(first ?? 0, MAX_SIZE), MIN_SIZE);

  const { status } = inputWhere ?? {};
  const where = {
    OR: [
      { authoringCompanyId: company.id },
      { approvals: { some: { approverSiret: company.orgId } } }
    ],
    ...(status && { status })
  };

  const revisionRequestsTotalCount = await prisma.bsddRevisionRequest.count({
    where
  });

  return getConnection({
    totalCount: revisionRequestsTotalCount,
    findMany: prismaPaginationArgs =>
      prisma.bsddRevisionRequest.findMany({
        where,
        ...prismaPaginationArgs,
        orderBy: { createdAt: "desc" }
      }),
    formatNode: node => node,
    ...{ after, first: pageSize }
  });
}
