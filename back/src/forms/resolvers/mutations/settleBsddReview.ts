import { Prisma } from "@prisma/client";
import { ForbiddenError, UserInputError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationSettleBsddReviewArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { getFirstUserCompanyInList } from "../../../users/database";

export default async function settleReview(
  _,
  { id, isAccepted }: MutationSettleBsddReviewArgs,
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

  const activeValidations = review.validations.filter(val => !val.isSettled);
  const userCompany = await getFirstUserCompanyInList(
    user.id,
    activeValidations.map(val => val.companyId)
  );

  if (!userCompany) {
    throw new ForbiddenError("Vous n'êtes pas destinataire de cette révision.");
  }

  const bsddReviewValidation = activeValidations.find(
    val => val.companyId === userCompany.id
  );

  if (isAccepted) {
    const { temporaryStorageDetail, ...bsddReview } = review.content as Partial<
      Prisma.FormUpdateInput
    >;
    await prisma.form.update({
      where: { id: review.bsddId },
      data: {
        ...bsddReview,
        ...(temporaryStorageDetail && {
          temporaryStorageDetail: { update: { ...temporaryStorageDetail } }
        })
      }
    });
  }

  await prisma.bsddReviewValidation.update({
    where: { id: bsddReviewValidation.id },
    data: { isAccepted, isSettled: true }
  });

  return prisma.bsddReview.findFirst({
    where: { id },
    include: { validations: true }
  });
}
