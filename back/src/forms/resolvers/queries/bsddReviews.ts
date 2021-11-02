import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { QueryBsddReviewsArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { checkIsCompanyMember } from "../../../users/permissions";

export default async function bsddReviews(
  _,
  { siret }: QueryBsddReviewsArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);
  const company = await getCompanyOrCompanyNotFound({ siret });
  await checkIsCompanyMember({ id: user.id }, { siret });

  return prisma.bsddReview.findMany({
    where: {
      OR: [{ toCompanyId: company.id }, { fromCompanyId: company.id }],
      isArchived: false
    }
  });
}
