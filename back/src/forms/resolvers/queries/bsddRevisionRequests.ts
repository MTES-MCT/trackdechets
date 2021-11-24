import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { QueryBsddRevisionRequestsArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { checkIsCompanyMember } from "../../../users/permissions";

export default async function bsddRevisionRequests(
  _,
  { siret }: QueryBsddRevisionRequestsArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);
  const company = await getCompanyOrCompanyNotFound({ siret });
  await checkIsCompanyMember({ id: user.id }, { siret });

  return prisma.bsddRevisionRequest.findMany({
    where: {
      OR: [
        { requestedById: company.id },
        { validations: { some: { companyId: company.id } } }
      ]
    }
  });
}
