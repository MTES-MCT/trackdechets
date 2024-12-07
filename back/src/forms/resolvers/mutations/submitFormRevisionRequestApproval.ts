import {
  Prisma,
  Status as FormStatus,
  RevisionRequestApprovalStatus as Status,
  RevisionRequestStatus,
  User
} from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationSubmitFormRevisionRequestApprovalArgs } from "@td/codegen-back";
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

  const currentApproverOrgId = await getCurrentApproverOrgId(
    user,
    revisionRequest
  );

  const approval = revisionRequest.approvals.find(
    approval => approval.approverSiret === currentApproverOrgId
  );

  if (!approval) {
    throw new Error(
      `No approval found for current approver siret ${currentApproverOrgId}`
    );
  }

  if (isApproved) {
    const form = await formRepository.findFirst({ id: revisionRequest.bsddId });

    if (!form) {
      throw new UserInputError("BSDD introuvable.");
    }

    if (
      revisionRequest.wasteAcceptationStatus &&
      revisionRequest.wasteAcceptationStatus !== form?.wasteAcceptationStatus
    ) {
      if (
        ![FormStatus.ACCEPTED, FormStatus.TEMP_STORER_ACCEPTED].includes(
          form.status
        )
      ) {
        throw new UserInputError(
          "Le statut d'acceptation des déchets n'est modifiable que si le bordereau est au stade de la réception."
        );
      }
    }

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

async function getCurrentApproverOrgId(
  user: User,
  revisionRequest: BsddRevisionRequestWithApprovals
) {
  const remainingApproverSirets = revisionRequest.approvals
    .filter(approval => approval.status === Status.PENDING)
    .map(approvals => approvals.approverSiret);

  const userCompanies = await getUserCompanies(user.id);
  const approvingCompaniesCandidates = userCompanies.filter(
    company => company.orgId && remainingApproverSirets.includes(company.orgId)
  );

  if (approvingCompaniesCandidates.length === 0) {
    throw new ForbiddenError(
      "Vous n'êtes pas destinataire de cette révision, ou alors cette révision a déjà été approuvée."
    );
  }

  return approvingCompaniesCandidates[0].orgId;
}
