import { Prisma } from "@prisma/client";
import { ForbiddenError, UserInputError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationSettleBsddReviewArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";

export default async function settleReview(
  _,
  { id, isAccepted }: MutationSettleBsddReviewArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const review = await prisma.bsddReview.findUnique({ where: { id } });

  if (!review) {
    throw new UserInputError("Révision introuvable.");
  }
  const userCompanies = await getUserCompanies(user.id);

  if (!userCompanies.find(company => company.id === review.toCompanyId)) {
    throw new ForbiddenError("Vous n'êtes pas destinataire de cette révision.");
  }

  if (isAccepted) {
    await prisma.form.update({
      where: { id: review.bsddId },
      data: {
        ...(review.content as Partial<Prisma.FormUpdateInput>)
      }
    });
  }

  return prisma.bsddReview.update({
    where: { id },
    data: { isAccepted, isArchived: true }
  });
}
