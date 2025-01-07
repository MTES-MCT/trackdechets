import {
  Prisma,
  RevisionRequestApprovalStatus as Status,
  RevisionRequestStatus,
  User
} from "@prisma/client";
import { checkIsAuthenticated } from "../../../../common/permissions";
import type { MutationSubmitBsdaRevisionRequestApprovalArgs } from "@td/codegen-back";
import { GraphQLContext } from "../../../../types";
import { getBsdasriRepository } from "../../../repository";
import { Permission, can, getUserRoles } from "../../../../permissions";
import { ForbiddenError, UserInputError } from "../../../../common/errors";

const bsdasriRevisionRequestWithApprovals =
  Prisma.validator<Prisma.BsdasriRevisionRequestDefaultArgs>()({
    include: { approvals: true }
  });
type BsdasriRevisionRequestWithApprovals =
  Prisma.BsdasriRevisionRequestGetPayload<
    typeof bsdasriRevisionRequestWithApprovals
  >;

export async function submitBsdasriRevisionRequestApproval(
  _,
  { id, isApproved, comment }: MutationSubmitBsdaRevisionRequestApprovalArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);
  const bsdasriRepository = getBsdasriRepository(user);

  const revisionRequest = (await bsdasriRepository.findUniqueRevisionRequest(
    { id },
    bsdasriRevisionRequestWithApprovals
  )) as BsdasriRevisionRequestWithApprovals;

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
      await bsdasriRepository.acceptRevisionRequestApproval(approval.id, {
        comment
      });
    } else {
      await bsdasriRepository.refuseRevisionRequestApproval(approval.id, {
        comment
      });
    }
  }

  return bsdasriRepository.findUniqueRevisionRequest({ id });
}

async function getCurrentApproverSirets(
  user: User,
  revisionRequest: BsdasriRevisionRequestWithApprovals
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
