import { BsddReview, Prisma } from "@prisma/client";
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
    throw new ForbiddenError(
      "Vous n'êtes pas destinataire de cette révision, ou alors cette révision n'est plus approuvable."
    );
  }

  const bsddReviewValidation = activeValidations.find(
    val => val.companyId === userCompany.id
  );
  await prisma.bsddReviewValidation.update({
    where: { id: bsddReviewValidation.id },
    data: { isAccepted, isSettled: true }
  });

  await updateReviewIfNecessary(review);

  return prisma.bsddReview.findFirst({
    where: { id },
    include: { validations: true }
  });
}

async function updateReviewIfNecessary({ id, content, bsddId }: BsddReview) {
  const validations = await prisma.bsddReview
    .findUnique({ where: { id: id } })
    .validations();

  const isReviewAccepted = validations.every(val => val.isAccepted);
  if (isReviewAccepted) {
    const { temporaryStorageDetail, ...bsddReview } =
      content as Partial<Prisma.FormUpdateInput>;
    await prisma.form.update({
      where: { id: bsddId },
      data: {
        ...bsddReview,
        ...(temporaryStorageDetail && {
          temporaryStorageDetail: { update: { ...temporaryStorageDetail } }
        })
      }
    });

    return;
  }

  const isReviewRefused = validations.some(val => val.isAccepted === false);
  // If one review is refused, mark every other validations as settled
  if (isReviewRefused) {
    await prisma.bsddReviewValidation.updateMany({
      where: { bsddReviewId: id },
      data: { isSettled: true }
    });
  }
}
