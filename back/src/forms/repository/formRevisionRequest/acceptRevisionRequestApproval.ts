import {
  BsddRevisionRequest,
  Prisma,
  RevisionRequestApprovalStatus,
  RevisionRequestStatus
} from "@prisma/client";
import { GraphQLContext } from "../../../types";
import { indexForm } from "../../elastic";
import buildFindFullFormById from "../form/findFullFormById";
import { LogMetadata, PrismaTransaction, RepositoryFnDeps } from "../types";

export type AcceptRevisionRequestApprovalFn = (
  revisionRequestApprovalId: string,
  { comment }: { comment?: string },
  logMetadata?: LogMetadata
) => Promise<void>;

const buildAcceptRevisionRequestApproval: (
  deps: RepositoryFnDeps
) => AcceptRevisionRequestApprovalFn =
  deps =>
  async (revisionRequestApprovalId, { comment }, logMetadata) => {
    const { prisma, user } = deps;

    const updatedApproval = await prisma.bsddRevisionRequestApproval.update({
      where: { id: revisionRequestApprovalId },
      data: {
        status: RevisionRequestApprovalStatus.ACCEPTED,
        comment
      }
    });

    await prisma.event.create({
      data: {
        streamId: updatedApproval.revisionRequestId,
        actor: user.id,
        type: "BsddRevisionRequestAccepted",
        data: {
          content: {
            status: RevisionRequestApprovalStatus.ACCEPTED,
            comment
          }
        },
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    // If it was the last approval:
    // - mark the revision as approved
    // - apply the revision to the BSDD
    const remainingApprovals = await prisma.bsddRevisionRequestApproval.count({
      where: {
        revisionRequestId: updatedApproval.revisionRequestId,
        status: RevisionRequestApprovalStatus.PENDING
      }
    });
    if (remainingApprovals !== 0) return;

    const revisionRequest = await approveAndApplyRevisionRequest(
      updatedApproval.revisionRequestId,
      { prisma, user, logMetadata }
    );

    const updatedFormId = revisionRequest.bsddId;

    if (updatedFormId) {
      const fullForm = await buildFindFullFormById(deps)(updatedFormId);
      await indexForm(fullForm, { user } as GraphQLContext);
    }
  };

function getUpdateFromFormRevisionRequest(
  revisionRequest: BsddRevisionRequest
) {
  const bsddUpdate = {
    recipientCap: revisionRequest.recipientCap,
    wasteDetailsCode: revisionRequest.wasteDetailsCode,
    wasteDetailsName: revisionRequest.wasteDetailsName,
    wasteDetailsPop: revisionRequest.wasteDetailsPop,
    wasteDetailsPackagingInfos: revisionRequest.wasteDetailsPackagingInfos,
    quantityReceived: revisionRequest.quantityReceived,
    processingOperationDone: revisionRequest.processingOperationDone,
    processingOperationDescription:
      revisionRequest.processingOperationDescription,
    brokerCompanyName: revisionRequest.brokerCompanyName,
    brokerCompanySiret: revisionRequest.brokerCompanySiret,
    brokerCompanyAddress: revisionRequest.brokerCompanyAddress,
    brokerCompanyContact: revisionRequest.brokerCompanyContact,
    brokerCompanyPhone: revisionRequest.brokerCompanyPhone,
    brokerCompanyMail: revisionRequest.brokerCompanyMail,
    brokerReceipt: revisionRequest.brokerReceipt,
    brokerDepartment: revisionRequest.brokerDepartment,
    brokerValidityLimit: revisionRequest.brokerValidityLimit,
    traderCompanyName: revisionRequest.traderCompanyName,
    traderCompanySiret: revisionRequest.traderCompanySiret,
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
      Object.entries(obj).filter(
        ([_, v]) => v != null && (Array.isArray(v) ? v.length > 0 : true)
      )
    );

    return Object.keys(cleanedObject).length === 0 ? null : cleanedObject;
  }

  return [removeEmpty(bsddUpdate), removeEmpty(temporaryStorageUpdate)];
}

export async function approveAndApplyRevisionRequest(
  revisionRequestId: string,
  context: {
    prisma: PrismaTransaction;
    user: Express.User;
    logMetadata?: LogMetadata;
  }
): Promise<BsddRevisionRequest> {
  const { prisma, user, logMetadata } = context;

  const revisionRequest = await prisma.bsddRevisionRequest.findUnique({
    where: { id: revisionRequestId }
  });
  const updatedRevisionRequest = await prisma.bsddRevisionRequest.update({
    where: { id: revisionRequest.id },
    data: { status: RevisionRequestStatus.ACCEPTED }
  });
  const [bsddUpdate, temporaryStorageUpdate] =
    getUpdateFromFormRevisionRequest(revisionRequest);

  await prisma.form.update({
    where: { id: revisionRequest.bsddId },
    data: {
      ...bsddUpdate,
      ...(temporaryStorageUpdate && {
        forwardedIn: { update: { ...temporaryStorageUpdate } }
      })
    }
  });

  await prisma.event.create({
    data: {
      streamId: revisionRequest.bsddId,
      actor: user.id,
      type: "BsddRevisionRequestApplied",
      data: {
        content: bsddUpdate,
        revisionRequestId: revisionRequest.id
      } as Prisma.InputJsonObject,
      metadata: { ...logMetadata, authType: user.auth }
    }
  });

  return updatedRevisionRequest;
}

export default buildAcceptRevisionRequestApproval;
