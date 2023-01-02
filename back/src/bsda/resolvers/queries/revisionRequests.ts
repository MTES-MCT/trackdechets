import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { QueryBsdaRevisionRequestsArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { checkIsCompanyMember } from "../../../users/permissions";
import { getReadonlyBsdaRepository } from "../../repository";
import { getConnection } from "../../../common/pagination";

const MIN_SIZE = 0;
const MAX_SIZE = 50;

export async function bsdaRevisionRequests(
  _,
  {
    siret,
    after,
    first = MAX_SIZE,
    where: inputWhere = {}
  }: QueryBsdaRevisionRequestsArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);
  await checkIsCompanyMember({ id: user.id }, { orgId: siret });
  const company = await getCompanyOrCompanyNotFound({ orgId: siret });

  const pageSize = Math.max(Math.min(first, MAX_SIZE), MIN_SIZE);

  const { status } = inputWhere;
  const where = {
    OR: [
      { authoringCompanyId: company.id },
      { approvals: { some: { approverSiret: company.orgId } } }
    ],
    ...(status && { status })
  };

  const bsdaRepository = getReadonlyBsdaRepository();
  const revisionRequestsTotalCount = await bsdaRepository.countRevisionRequests(
    where
  );

  return getConnection({
    totalCount: revisionRequestsTotalCount,
    findMany: prismaPaginationArgs =>
      bsdaRepository.findManyBsdaRevisionRequest(where, {
        ...prismaPaginationArgs,

        orderBy: { createdAt: "desc" }
      }),
    formatNode: node => node,
    ...{ after, first: pageSize }
  });
}
