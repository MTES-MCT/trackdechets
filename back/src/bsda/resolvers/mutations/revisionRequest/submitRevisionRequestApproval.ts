import {
  Prisma,
  RevisionRequestApprovalStatus as Status,
  RevisionRequestStatus,
  User
} from "@prisma/client";
import { checkIsAuthenticated } from "../../../../common/permissions";
import type { MutationSubmitBsdaRevisionRequestApprovalArgs } from "@td/codegen-back";
import { GraphQLContext } from "../../../../types";
import { getBsdaRepository } from "../../../repository";
import { Permission, can, getUserRoles } from "../../../../permissions";
import { ForbiddenError, UserInputError } from "../../../../common/errors";

const bsdaRevisionRequestWithApprovals =
  Prisma.validator<Prisma.BsdaRevisionRequestDefaultArgs>()({
    include: { approvals: true }
  });
type BsdaRevisionRequestWithApprovals = Prisma.BsdaRevisionRequestGetPayload<
  typeof bsdaRevisionRequestWithApprovals
>;

export async function submitBsdaRevisionRequestApproval(
  _,
  { id, isApproved, comment }: MutationSubmitBsdaRevisionRequestApprovalArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);
  const bsdaRepository = getBsdaRepository(user);

  const revisionRequest = (await bsdaRepository.findUniqueRevisionRequest(
    { id },
    bsdaRevisionRequestWithApprovals
  )) as BsdaRevisionRequestWithApprovals;

  if (!revisionRequest) {
    throw new UserInputError("Révision introuvable.");
  }

  if (revisionRequest.status === RevisionRequestStatus.REFUSED) {
    throw new ForbiddenError(
      "Cette révision n'est plus approuvable, au moins un acteur l'a refusée."
    );
  }

  const currentApproverSirets = await getCurrentApproverSirets(
    user,
    revisionRequest
  );

  for (const currentApproverSiret of currentApproverSirets) {
    const approval = revisionRequest.approvals.find(
      approval => approval.approverSiret === currentApproverSiret
    );

    if (!approval) {
      throw new UserInputError(
        "Vous n'êtes pas approbateur de cette révision."
      );
    }

    if (isApproved) {
      await bsdaRepository.acceptRevisionRequestApproval(approval.id, {
        comment
      });
    } else {
      await bsdaRepository.refuseRevisionRequestApproval(approval.id, {
        comment
      });
    }
  }

  return bsdaRepository.findUniqueRevisionRequest({ id });
}

async function getCurrentApproverSirets(
  user: User,
  revisionRequest: BsdaRevisionRequestWithApprovals
): Promise<string[]> {
  const remainingApproverSirets = revisionRequest.approvals
    .filter(approval => approval.status === Status.PENDING)
    .map(approvals => approvals.approverSiret);

  const roles = await getUserRoles(user.id);
  const userOrgIds = Object.keys(roles).filter(orgId =>
    can(roles[orgId], Permission.BsdCanRevise)
  );

  const approvingCompaniesCandidates = userOrgIds.filter(orgId =>
    remainingApproverSirets.includes(orgId)
  );

  if (!approvingCompaniesCandidates.length) {
    throw new ForbiddenError(
      "Vous n'êtes pas destinataire de cette révision, ou alors cette révision a déjà été approuvée."
    );
  }

  return approvingCompaniesCandidates;
}
