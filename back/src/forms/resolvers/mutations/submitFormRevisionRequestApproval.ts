import {
  Prisma,
  RevisionRequestApprovalStatus as Status,
  RevisionRequestStatus,
  User
} from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationSubmitFormRevisionRequestApprovalArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";
import { getFormRepository } from "../../repository";
import { ForbiddenError, UserInputError } from "../../../common/errors";

const formRevisionRequestWithApprovals =
  Prisma.validator<Prisma.BsddRevisionRequestArgs>()({
    include: { approvals: true }
  });
type BsddRevisionRequestWithApprovals = Prisma.BsddRevisionRequestGetPayload<
  typeof formRevisionRequestWithApprovals
>;

export default async function submitFormRevisionRequestApproval(
  _,
  { id, isApproved, comment }: MutationSubmitFormRevisionRequestApprovalArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);
  const formRepository = getFormRepository(user);

  const revisionRequest = (await formRepository.getRevisionRequestById(
    id,
    formRevisionRequestWithApprovals
  )) as BsddRevisionRequestWithApprovals;

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
    throw new Error(
      `No approval found for current approver siret ${currentApproverSiret}`
    );
  }

  if (isApproved) {
    await formRepository.acceptRevisionRequestApproval(approval.id, {
      comment
    });
  } else {
    await formRepository.refuseRevisionRequestApproval(approval.id, {
      comment
    });
  }

  return formRepository.getRevisionRequestById(id);
}

async function getCurrentApproverSiret(
  user: User,
  revisionRequest: BsddRevisionRequestWithApprovals
) {
  const remainingApproverSirets = revisionRequest.approvals
    .filter(approval => approval.status === Status.PENDING)
    .map(approvals => approvals.approverSiret);

  const userCompanies = await getUserCompanies(user.id);
  const approvingCompaniesCandidates = userCompanies.filter(
    company => company.siret && remainingApproverSirets.includes(company.siret)
  );

  if (approvingCompaniesCandidates.length === 0) {
    throw new ForbiddenError(
      "Vous n'êtes pas destinataire de cette révision, ou alors cette révision a déjà été approuvée."
    );
  }

  return approvingCompaniesCandidates[0].siret;
}
