import { RevisionRequestStatus } from "@td/prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationCancelFormRevisionRequestArgs } from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";
import { getFormRepository } from "../../repository";
import { ForbiddenError, UserInputError } from "../../../common/errors";

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
