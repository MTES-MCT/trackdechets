import { RevisionRequestAcceptationStatus, BsddRevisionRequest, Prisma } from "@prisma/client";
import { ForbiddenError, UserInputError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationSettleBsddRevisionRequestArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { getFirstUserCompanyInList } from "../../../users/database";

export default async function settleRevisionRequest(
  _,
  { id, isAccepted }: MutationSettleBsddRevisionRequestArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const revisionRequest = await prisma.bsddRevisionRequest.findUnique({
    where: { id },
    include: { validations: true }
  });

  if (!revisionRequest) {
    throw new UserInputError("Révision introuvable.");
  }

  if (
    revisionRequest.validations.some(
      val => val.status === RevisionRequestAcceptationStatus.REFUSED
    )
  ) {
    throw new ForbiddenError(
      "Cette révision n'est plus approuvable, au moins un acteur la refusée."
    );
  }

  const activeValidations = revisionRequest.validations.filter(
    val => val.status === RevisionRequestAcceptationStatus.PENDING
  );
  const userCompany = await getFirstUserCompanyInList(
    user.id,
    activeValidations.map(val => val.companyId)
  );

  if (!userCompany) {
    throw new ForbiddenError(
      "Vous n'êtes pas destinataire de cette révision, ou alors cette révision n'est plus approuvable."
    );
  }

  const bsddRevisionRequestValidation = activeValidations.find(
    val => val.companyId === userCompany.id
  );
  await prisma.bsddRevisionRequestValidation.update({
    where: { id: bsddRevisionRequestValidation.id },
    data: {
      status: isAccepted
        ? RevisionRequestAcceptationStatus.ACCEPTED
        : RevisionRequestAcceptationStatus.REFUSED
    }
  });

  await updateFormIfNecessary(revisionRequest);

  return prisma.bsddRevisionRequest.findFirst({
    where: { id },
    include: { validations: true }
  });
}

async function updateFormIfNecessary({
  id,
  content,
  bsddId
}: BsddRevisionRequest) {
  const validations = await prisma.bsddRevisionRequest
    .findUnique({ where: { id: id } })
    .validations();

  const isReviewAccepted = validations.every(
    val => val.status === RevisionRequestAcceptationStatus.ACCEPTED
  );
  if (!isReviewAccepted) {
    return;
  }

  const { temporaryStorageDetail, ...bsddRevisionRequest } =
    content as Partial<Prisma.FormUpdateInput>;
  await prisma.form.update({
    where: { id: bsddId },
    data: {
      ...bsddRevisionRequest,
      ...(temporaryStorageDetail && {
        temporaryStorageDetail: { update: { ...temporaryStorageDetail } }
      })
    }
  });
}
