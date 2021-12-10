import {
  RevisionRequestApprovalStatus as Status,
  BsddRevisionRequest,
  Prisma,
  RevisionRequestStatus,
  BsddRevisionRequestApproval,
  User
} from "@prisma/client";
import { ForbiddenError, UserInputError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationSubmitBsddRevisionRequestApprovalArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";

type BsddRevisionRequestWithApprovals = BsddRevisionRequest & {
  approvals: BsddRevisionRequestApproval[];
};

export default async function submitBsddRevisionRequestApproval(
  _,
  { id, isApproved, comment }: MutationSubmitBsddRevisionRequestApprovalArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const revisionRequest = await prisma.bsddRevisionRequest.findUnique({
    where: { id },
    include: { approvals: true }
  });

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

  const updatedApproval = await prisma.bsddRevisionRequestApproval.update({
    where: { id: approval.id },
    data: {
      status: isApproved ? Status.ACCEPTED : Status.REFUSED,
      comment
    }
  });

  await reverberateChangeOnAssociatedObjects(revisionRequest, updatedApproval);

  return prisma.bsddRevisionRequest.findFirst({
    where: { id }
  });
}

async function getCurrentApproverSiret(
  user: User,
  revisionRequest: BsddRevisionRequestWithApprovals
) {
  const remainingApproverSirets = revisionRequest.approvals
    .filter(approval => approval.status === Status.PENDING)
    .map(approvals => approvals.approverSiret);

  const userCompanies = await getUserCompanies(user.id);
  const approvingCompaniesCandidates = userCompanies.filter(company =>
    remainingApproverSirets.includes(company.siret)
  );

  if (approvingCompaniesCandidates.length === 0) {
    throw new ForbiddenError(
      "Vous n'êtes pas destinataire de cette révision, ou alors cette révision a déjà été approuvée."
    );
  }

  return approvingCompaniesCandidates[0].siret;
}

async function reverberateChangeOnAssociatedObjects(
  revisionRequest: BsddRevisionRequestWithApprovals,
  updatedApproval: BsddRevisionRequestApproval
) {
  // We have a refusal:
  // - mark revision as refused
  // - mark every awaiting approval as skipped
  if (updatedApproval.status === Status.REFUSED) {
    await prisma.bsddRevisionRequest.update({
      where: { id: revisionRequest.id },
      data: { status: RevisionRequestStatus.REFUSED }
    });
    await prisma.bsddRevisionRequestApproval.updateMany({
      where: {
        revisionRequestId: revisionRequest.id,
        status: Status.PENDING
      },
      data: { status: Status.CANCELED }
    });
    return;
  }

  // We have an approval. If it was the last approval:
  // - mark the revision as approved
  // - apply the revision to the BSDD
  const updatedApprovals = revisionRequest.approvals.map(approval => {
    if (approval.id === updatedApproval.id) return updatedApproval;
    return approval;
  });
  if (updatedApprovals.every(approval => approval.status === Status.ACCEPTED)) {
    await prisma.bsddRevisionRequest.update({
      where: { id: revisionRequest.id },
      data: { status: RevisionRequestStatus.ACCEPTED }
    });

    const [bsddUpdate, temporaryStorageUpdate] =
      getUpdateFromBsddRevisionRequest(revisionRequest);

    await prisma.form.update({
      where: { id: revisionRequest.bsddId },
      data: {
        ...bsddUpdate,
        ...(temporaryStorageUpdate && {
          temporaryStorageDetail: { update: { ...temporaryStorageUpdate } }
        })
      }
    });
  }
}

function getUpdateFromBsddRevisionRequest(
  revisionRequest: BsddRevisionRequest
) {
  const bsddUpdate = {
    recipientCap: revisionRequest.recipientCap,
    wasteDetailsCode: revisionRequest.wasteDetailsCode,
    wasteDetailsPop: revisionRequest.wasteDetailsPop,
    quantityReceived: revisionRequest.quantityReceived,
    processingOperationDone: revisionRequest.processingOperationDone,
    brokerCompanyName: revisionRequest.brokerCompanyName,
    brokerCompanySiret: revisionRequest.brokerCompanySiret,
    brokerCompanyAddress: revisionRequest.brokerCompanyAddress,
    brokerCompanyContact: revisionRequest.brokerCompanyContact,
    brokerCompanyPhone: revisionRequest.brokerCompanyPhone,
    brokerCompanyMail: revisionRequest.brokerCompanyMail,
    brokerReceipt: revisionRequest.brokerReceipt,
    brokerDepartment: revisionRequest.brokerDepartment,
    brokerValidityLimit: revisionRequest.brokerValidityLimit,
    traderCompanyAddress: revisionRequest.traderCompanyAddress,
    traderCompanyContact: revisionRequest.traderCompanyContact,
    traderCompanyPhone: revisionRequest.traderCompanyPhone,
    traderCompanyMail: revisionRequest.traderCompanyMail,
    traderReceipt: revisionRequest.traderReceipt,
    traderDepartment: revisionRequest.traderDepartment,
    traderValidityLimit: revisionRequest.traderValidityLimit
  };

  const temporaryStorageUpdate = {
    destinationCap: revisionRequest.temporaryStorageDestinationCap,
    destinationProcessingOperation:
      revisionRequest.temporaryStorageDestinationProcessingOperation
  };

  function removeEmpty(obj) {
    const cleanedObject = Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v != null)
    );

    return Object.keys(cleanedObject).length === 0 ? null : cleanedObject;
  }

  return [removeEmpty(bsddUpdate), removeEmpty(temporaryStorageUpdate)];
}
