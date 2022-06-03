import { RevisionRequestStatus } from "@prisma/client";
import { ForbiddenError, UserInputError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../../common/permissions";
import { MutationCancelBsdaRevisionRequestArgs } from "../../../../generated/graphql/types";
import { GraphQLContext } from "../../../../types";
import { getUserCompanies } from "../../../../users/database";
import { getBsdaRepository } from "../../../repository";

export default async function cancelBsdaRevisionRequest(
  _,
  { id }: MutationCancelBsdaRevisionRequestArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);
  const bsdaRepository = await getBsdaRepository(user);

  const revisionRequest = await bsdaRepository.findUniqueRevisionRequest({
    id
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

  await bsdaRepository.cancelRevisionRequest({ id });
  return true;
}
