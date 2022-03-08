import {
  BsddRevisionRequest,
  Prisma,
  PrismaClient,
  RevisionRequestApprovalStatus,
  RevisionRequestStatus
} from "@prisma/client";
import { GraphQLContext } from "../../types";
import { indexForm } from "../elastic";
import { buildFormRepository } from "./form";

type LogMetadata = Record<string, unknown>;

export type FormRevisionRequestActions = {
  getRevisionRequestById(
    id: string,
    options?: Omit<Prisma.BsddRevisionRequestFindUniqueArgs, "where">
  ): Promise<BsddRevisionRequest>;
  cancelRevisionRequest(
    where: Prisma.BsddRevisionRequestWhereUniqueInput,
    logMetadata?: LogMetadata
  ): Promise<BsddRevisionRequest>;
  createRevisionRequest(
    data: Prisma.BsddRevisionRequestCreateInput,
    logMetadata?: LogMetadata
  ): Promise<BsddRevisionRequest>;
  acceptRevisionRequestApproval(
    revisionRequestApprovalId: string,
    { comment }: { comment?: string },
    logMetadata?: LogMetadata
  ): Promise<void>;
  refuseRevisionRequestApproval(
    revisionRequestApprovalId: string,
    { comment }: { comment?: string },
    logMetadata?: LogMetadata
  ): Promise<void>;
  countRevisionRequests(
    where: Prisma.BsddRevisionRequestWhereInput
  ): Promise<number>;
};

export function buildFormRevisionRequestRepository(
  dbClient: PrismaClient,
  user: Express.User
): FormRevisionRequestActions {
  function getRevisionRequestById(
    id: string,
    options?: Omit<Prisma.BsddRevisionRequestFindUniqueArgs, "where">
  ): Promise<BsddRevisionRequest> {
    return dbClient.bsddRevisionRequest.findUnique({
      where: { id },
      ...options
    });
  }

  async function cancelRevisionRequest(
    where: Prisma.BsddRevisionRequestWhereUniqueInput,
    logMetadata?: LogMetadata
  ): Promise<BsddRevisionRequest> {
    const deletedRevisionRequest = await dbClient.$transaction(
      async transaction => {
        const revisionRequest = await transaction.bsddRevisionRequest.delete({
          where
        });

        await transaction.event.create({
          data: {
            streamId: revisionRequest.id,
            actor: user.id,
            type: "BsddRevisionRequestCancelled",
            data: {},
            metadata: { ...logMetadata, authType: user.auth }
          }
        });
        return revisionRequest;
      }
    );

    return deletedRevisionRequest;
  }

  async function createRevisionRequest(
    data: Prisma.BsddRevisionRequestCreateInput,
    logMetadata?: LogMetadata
  ): Promise<BsddRevisionRequest> {
    const createdRevisionRequest = await dbClient.$transaction(
      async transaction => {
        const revisionRequest = await transaction.bsddRevisionRequest.create({
          data
        });

        await transaction.event.create({
          data: {
            streamId: revisionRequest.id,
            actor: user.id,
            type: "BsddRevisionRequestCreated",
            data: { content: data } as Prisma.InputJsonObject,
            metadata: { ...logMetadata, authType: user.auth }
          }
        });
        return revisionRequest;
      }
    );

    return createdRevisionRequest;
  }

  function countRevisionRequests(
    where: Prisma.BsddRevisionRequestWhereInput
  ): Promise<number> {
    return dbClient.bsddRevisionRequest.count({ where });
  }

  async function refuseRevisionRequestApproval(
    revisionRequestApprovalId: string,
    { comment }: { comment?: string },
    logMetadata?: LogMetadata
  ): Promise<void> {
    return dbClient.$transaction(async transaction => {
      const revisionRequestApproval =
        await transaction.bsddRevisionRequestApproval.update({
          where: { id: revisionRequestApprovalId },
          data: {
            status: RevisionRequestApprovalStatus.REFUSED,
            comment
          }
        });

      // We have a refusal:
      // - mark revision as refused
      // - mark every awaiting approval as skipped
      await transaction.bsddRevisionRequest.update({
        where: { id: revisionRequestApproval.revisionRequestId },
        data: { status: RevisionRequestStatus.REFUSED }
      });
      await transaction.bsddRevisionRequestApproval.updateMany({
        where: {
          revisionRequestId: revisionRequestApproval.id,
          status: RevisionRequestApprovalStatus.PENDING
        },
        data: { status: RevisionRequestApprovalStatus.CANCELED }
      });

      await transaction.event.create({
        data: {
          streamId: revisionRequestApproval.revisionRequestId,
          actor: user.id,
          type: "BsddRevisionRequestRefused",
          data: {
            content: {
              status: RevisionRequestApprovalStatus.REFUSED,
              comment
            }
          },
          metadata: { ...logMetadata, authType: user.auth }
        }
      });
    });
  }

  async function acceptRevisionRequestApproval(
    revisionRequestApprovalId: string,
    { comment }: { comment?: string },
    logMetadata?: LogMetadata
  ): Promise<void> {
    const updatedFormId = await dbClient.$transaction(async transaction => {
      const updatedApproval =
        await transaction.bsddRevisionRequestApproval.update({
          where: { id: revisionRequestApprovalId },
          data: {
            status: RevisionRequestApprovalStatus.ACCEPTED,
            comment
          }
        });

      // If it was the last approval:
      // - mark the revision as approved
      // - apply the revision to the BSDD
      const revisionRequest = await transaction.bsddRevisionRequest.findUnique({
        where: { id: updatedApproval.revisionRequestId }
      });
      const remainingApprovals =
        await transaction.bsddRevisionRequestApproval.count({
          where: {
            revisionRequestId: revisionRequest.id,
            status: RevisionRequestApprovalStatus.PENDING
          }
        });
      if (remainingApprovals !== 0) return;

      await transaction.bsddRevisionRequest.update({
        where: { id: revisionRequest.id },
        data: { status: RevisionRequestStatus.ACCEPTED }
      });
      const [bsddUpdate, temporaryStorageUpdate] =
        getUpdateFromFormRevisionRequest(revisionRequest);

      await transaction.form.update({
        where: { id: revisionRequest.bsddId },
        data: {
          ...bsddUpdate,
          ...(temporaryStorageUpdate && {
            temporaryStorageDetail: { update: { ...temporaryStorageUpdate } }
          })
        }
      });

      await transaction.event.create({
        data: {
          streamId: updatedApproval.revisionRequestId,
          actor: user.id,
          type: "BsddRevisionRequestRefused",
          data: {
            content: {
              status: RevisionRequestApprovalStatus.ACCEPTED,
              comment
            }
          },
          metadata: { ...logMetadata, authType: user.auth }
        }
      });
      await transaction.event.create({
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

      return revisionRequest.bsddId;
    });

    if (updatedFormId) {
      const fullForm = await buildFormRepository(
        dbClient,
        user
      ).findFullFormById(updatedFormId);
      await indexForm(fullForm, { user } as GraphQLContext);
    }
  }

  return {
    getRevisionRequestById,
    cancelRevisionRequest,
    createRevisionRequest,
    countRevisionRequests,
    acceptRevisionRequestApproval,
    refuseRevisionRequestApproval
  };
}

function getUpdateFromFormRevisionRequest(
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
