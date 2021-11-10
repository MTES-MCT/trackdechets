import { UserInputError } from "apollo-server-core";
import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryBsddReviewArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { checkIsOneOfTheCompaniesMember } from "../../permissions";

export default async function bsddReview(
  _,
  { id }: QueryBsddReviewArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);
  const review = await prisma.bsddReview.findUnique({
    where: { id },
    include: { validations: true }
  });

  if (!review) {
    throw new UserInputError("Révision introuvable.");
  }

  const companiesIdsOnReview = [
    review.requestedById,
    ...review.validations.map(val => val.companyId)
  ];
  await checkIsOneOfTheCompaniesMember(user.id, companiesIdsOnReview);

  return review;
}
