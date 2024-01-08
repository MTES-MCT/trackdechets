import { RevisionRequestStatus } from "@prisma/client";
import { checkIsAuthenticated } from "../../../../common/permissions";
import { MutationCancelBsdaRevisionRequestArgs } from "../../../../generated/graphql/types";
import { GraphQLContext } from "../../../../types";
import { getBsdaRepository } from "../../../repository";
import { Permission, can, getUserRoles } from "../../../../permissions";
import { prisma } from "@td/prisma";
import { ForbiddenError, UserInputError } from "../../../../common/errors";

export async function cancelBsdaRevisionRequest(
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

  const authoringCompany = await prisma.company.findUniqueOrThrow({
    where: { id: revisionRequest.authoringCompanyId }
  });

  const userRoles = await getUserRoles(user.id);
  if (
    !userRoles[authoringCompany.orgId] ||
    !can(userRoles[authoringCompany.orgId], Permission.BsdCanRevise)
  ) {
    throw new ForbiddenError("Vous n'êtes pas l'auteur de cette révision.");
  }

  await bsdaRepository.cancelRevisionRequest({ id });
  return true;
}
