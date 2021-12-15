import { RevisionRequestStatus } from "@prisma/client";
import { ForbiddenError, UserInputError } from "apollo-server-core";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationCancelFormRevisionRequestArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";

export default async function cancelFormRevisionRequest(
  _,
  { id }: MutationCancelFormRevisionRequestArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);
  const revisionRequest = await prisma.bsddRevisionRequest.findUnique({
    where: { id }
  });

  if (!revisionRequest) {
    throw new UserInputError("Révision introuvable.");
  }

  if (revisionRequest.status !== RevisionRequestStatus.PENDING) {
    throw new UserInputError(
      "La révision n'est pas annulable. Elle a déjà été acceptée ou refusée."
    );
  }

  const userCompanies = await getUserCompanies(user.id);

  if (
    !userCompanies.find(
      company => company.id === revisionRequest.authoringCompanyId
    )
  ) {
    throw new ForbiddenError("Vous n'êtes pas l'auteur de cette révision.");
  }

  await prisma.bsddRevisionRequest.delete({ where: { id } });
  return true;
}
