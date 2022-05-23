import { RevisionRequestStatus } from "@prisma/client";
import { ForbiddenError, UserInputError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationCancelFormRevisionRequestArgs } from "@trackdechets/codegen/src/back.gen";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";
import { getFormRepository } from "../../repository";

export default async function cancelFormRevisionRequest(
  _,
  { id }: MutationCancelFormRevisionRequestArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);
  const formRepository = await getFormRepository(user);

  const revisionRequest = await formRepository.getRevisionRequestById(id);

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

  await formRepository.cancelRevisionRequest({ id });
  return true;
}
