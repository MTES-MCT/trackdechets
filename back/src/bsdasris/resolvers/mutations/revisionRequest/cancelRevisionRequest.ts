import { RevisionRequestStatus } from "@prisma/client";
import { checkIsAuthenticated } from "../../../../common/permissions";
import { MutationCancelBsdaRevisionRequestArgs } from "@td/codegen-back";
import { GraphQLContext } from "../../../../types";
import { getBsdasriRepository } from "../../../repository";
import { Permission, can, getUserRoles } from "../../../../permissions";
import { prisma } from "@td/prisma";
import { ForbiddenError, UserInputError } from "../../../../common/errors";

export async function cancelBsdasriRevisionRequest(
  _,
  { id }: MutationCancelBsdaRevisionRequestArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);
  const bsdasriRepository = getBsdasriRepository(user);

  const revisionRequest = await bsdasriRepository.findUniqueRevisionRequest({
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

  await bsdasriRepository.cancelRevisionRequest({ id });
  return true;
}
