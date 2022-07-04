import prisma from "../../prisma";
import buildCountForms from "./form/count";
import buildCreateForm from "./form/create";
import buildDeleteForm from "./form/delete";
import buildFindAppendix2FormsById from "./form/findAppendix2FormsById";
import buildFindForwardedInById from "./form/findForwardedInById";
import buildFindFullFormById from "./form/findFullFormById";
import buildFindUniqueForm from "./form/findUnique";
import buildRemoveAppendix2 from "./form/removeAppendix2";
import buildUpdateForm from "./form/update";
import buildUpdateManyForms from "./form/updateMany";
import buildAcceptRevisionRequestApproval from "./formRevisionRequest/acceptRevisionRequestApproval";
import buildCancelRevisionRequest from "./formRevisionRequest/cancelRevisionRequest";
import buildCountRevisionRequests from "./formRevisionRequest/countRevisionRequest";
import buildCreateRevisionRequest from "./formRevisionRequest/createRevisionRequest";
import buildGetRevisionRequestById from "./formRevisionRequest/getRevisionRequestById";
import buildRefuseRevisionRequestApproval from "./formRevisionRequest/refuseRevisionRequestApproval";
import {
  FormActions,
  FormRevisionRequestActions,
  PrismaTransaction
} from "./types";
import buildSetAppendix2 from "./form/setAppendix2";
import buildUpdateAppendix2Forms from "./form/updateAppendix2Forms";
import buildDeleteFormStaleSegments from "./form/deleteStaleSegments";

export type FormRepository = FormActions & FormRevisionRequestActions;

export function getFormRepository(
  user: Express.User,
  transaction?: PrismaTransaction
): FormRepository {
  const formActions: FormActions = {
    // READ operations
    findUnique: buildFindUniqueForm({ prisma, user }),
    findFullFormById: buildFindFullFormById({ prisma, user }),
    findAppendix2FormsById: buildFindAppendix2FormsById({ prisma, user }),
    findForwardedInById: buildFindForwardedInById({ prisma, user }),
    count: buildCountForms({ prisma, user }),
    // WRITE OPERATIONS - wrapped into a transaction
    create: (...args) =>
      transaction
        ? buildCreateForm({ prisma: transaction, user })(...args)
        : prisma.$transaction(prisma =>
            buildCreateForm({ prisma, user })(...args)
          ),
    update: (...args) =>
      transaction
        ? buildUpdateForm({ prisma: transaction, user })(...args)
        : prisma.$transaction(prisma =>
            buildUpdateForm({ prisma, user })(...args)
          ),
    updateMany: (...args) =>
      transaction
        ? buildUpdateManyForms({ prisma: transaction, user })(...args)
        : prisma.$transaction(prisma =>
            buildUpdateManyForms({ prisma, user })(...args)
          ),
    delete: (...args) =>
      transaction
        ? buildDeleteForm({ prisma: transaction, user })(...args)
        : prisma.$transaction(prisma =>
            buildDeleteForm({ prisma, user })(...args)
          ),
    removeAppendix2: (...args) =>
      transaction
        ? buildRemoveAppendix2({ prisma: transaction, user })(...args)
        : prisma.$transaction(prisma =>
            buildRemoveAppendix2({ prisma, user })(...args)
          ),
    setAppendix2: (...args) =>
      transaction
        ? buildSetAppendix2({ prisma: transaction, user })(...args)
        : prisma.$transaction(prisma =>
            buildSetAppendix2({ prisma, user })(...args)
          ),
    updateAppendix2Forms: (...args) =>
      transaction
        ? buildUpdateAppendix2Forms({ prisma: transaction, user })(...args)
        : prisma.$transaction(prisma =>
            buildUpdateAppendix2Forms({ prisma, user })(...args)
          ),
    deleteStaleSegments: (...args) =>
      transaction
        ? buildDeleteFormStaleSegments({ prisma: transaction, user })(...args)
        : prisma.$transaction(prisma =>
            buildDeleteFormStaleSegments({ prisma, user })(...args)
          )
  };

  const formRevisionRequestActions: FormRevisionRequestActions = {
    // READ operations
    getRevisionRequestById: buildGetRevisionRequestById({ prisma, user }),
    countRevisionRequests: buildCountRevisionRequests({ prisma, user }),
    // WRITE operations - wrapped into a transaction
    cancelRevisionRequest: (...args) =>
      transaction
        ? buildCancelRevisionRequest({ prisma: transaction, user })(...args)
        : prisma.$transaction(prisma =>
            buildCancelRevisionRequest({ prisma, user })(...args)
          ),
    createRevisionRequest: (...args) =>
      transaction
        ? buildCreateRevisionRequest({ prisma: transaction, user })(...args)
        : prisma.$transaction(prisma =>
            buildCreateRevisionRequest({ prisma, user })(...args)
          ),
    acceptRevisionRequestApproval: (...args) =>
      transaction
        ? buildAcceptRevisionRequestApproval({ prisma: transaction, user })(
            ...args
          )
        : prisma.$transaction(prisma =>
            buildAcceptRevisionRequestApproval({ prisma, user })(...args)
          ),
    refuseRevisionRequestApproval: (...args) =>
      transaction
        ? buildRefuseRevisionRequestApproval({ prisma: transaction, user })(
            ...args
          )
        : prisma.$transaction(prisma =>
            buildRefuseRevisionRequestApproval({ prisma, user })(...args)
          )
  };

  return {
    ...formActions,
    ...formRevisionRequestActions
  };
}
