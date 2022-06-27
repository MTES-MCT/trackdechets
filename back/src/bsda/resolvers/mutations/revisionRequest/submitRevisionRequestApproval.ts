import {
  Prisma,
  RevisionRequestApprovalStatus as Status,
  RevisionRequestStatus,
  User
} from "@prisma/client";
import { ForbiddenError, UserInputError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../../common/permissions";
import { MutationSubmitBsdaRevisionRequestApprovalArgs } from "../../../../generated/graphql/types";
import { GraphQLContext } from "../../../../types";
import { getUserCompanies } from "../../../../users/database";
import { getBsdaRepository } from "../../../repository";

const bsdaRevisionRequestWithApprovals =
  Prisma.validator<Prisma.BsdaRevisionRequestArgs>()({
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

  const currentApproverSiret = await getCurrentApproverSiret(
    user,
    revisionRequest
  );
  const approval = revisionRequest.approvals.find(
    approval => approval.approverSiret === currentApproverSiret
  );

  if (!approval) {
    throw new UserInputError("Vous n'êtes pas approbateur de cette révision.");
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

  return bsdaRepository.findUniqueRevisionRequest({ id });
}

async function getCurrentApproverSiret(
  user: User,
  revisionRequest: BsdaRevisionRequestWithApprovals
) {
  const remainingApproverSirets = revisionRequest.approvals
    .filter(approval => approval.status === Status.PENDING)
    .map(approvals => approvals.approverSiret);

  const userCompanies = await getUserCompanies(user.id);
  const approvingCompaniesCandidate = userCompanies.find(company =>
    remainingApproverSirets.includes(company.siret)
  );

  if (!approvingCompaniesCandidate) {
    throw new ForbiddenError(
      "Vous n'êtes pas destinataire de cette révision, ou alors cette révision a déjà été approuvée."
    );
  }

  return approvingCompaniesCandidate.siret;
}
