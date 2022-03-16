import prisma from "../../prisma";
import buildCountForms from "./form/count";
import buildCreateForm from "./form/create";
import buildCreateTemporaryStorage from "./form/createTemporaryStorage";
import buildDeleteForm from "./form/delete";
import buildFindAppendix2FormsById from "./form/findAppendix2FormsById";
import buildFindFullFormById from "./form/findFullFormById";
import buildFindUniqueForm from "./form/findUnique";
import buildUpdateForm from "./form/update";
import buildUpdateManyForms from "./form/updateMany";
import buildAcceptRevisionRequestApproval from "./formRevisionRequest/acceptRevisionRequestApproval";
import buildCancelRevisionRequest from "./formRevisionRequest/cancelRevisionRequest";
import buildCountRevisionRequests from "./formRevisionRequest/countRevisionRequest";
import buildCreateRevisionRequest from "./formRevisionRequest/createRevisionRequest";
import buildGetRevisionRequestById from "./formRevisionRequest/getRevisionRequestById";
import buildRefuseRevisionRequestApproval from "./formRevisionRequest/refuseRevisionRequestApproval";
import { FormActions, FormRevisionRequestActions } from "./types";

export type FormRepository = FormActions & FormRevisionRequestActions;

export function getFormRepository(user: Express.User): FormRepository {
  const formActions: FormActions = {
    // READ operations
    findUnique: buildFindUniqueForm({ prisma, user }),
    findFullFormById: buildFindFullFormById({ prisma, user }),
    findAppendix2FormsById: buildFindAppendix2FormsById({ prisma, user }),
    count: buildCountForms({ prisma, user }),
    // WRITE OPERATIONS - wrapped into a transaction
    create: (...args) =>
      prisma.$transaction(prisma => buildCreateForm({ prisma, user })(...args)),
    update: (...args) =>
      prisma.$transaction(prisma => buildUpdateForm({ prisma, user })(...args)),
    updateMany: (...args) =>
      prisma.$transaction(prisma =>
        buildUpdateManyForms({ prisma, user })(...args)
      ),
    delete: (...args) =>
      prisma.$transaction(prisma => buildDeleteForm({ prisma, user })(...args)),
    createTemporaryStorage: (...args) =>
      prisma.$transaction(prisma =>
        buildCreateTemporaryStorage({ prisma, user })(...args)
      )
  };

  const formRevisionRequestActions: FormRevisionRequestActions = {
    // READ operations
    getRevisionRequestById: buildGetRevisionRequestById({ prisma, user }),
    countRevisionRequests: buildCountRevisionRequests({ prisma, user }),
    // WRITE operations - wrapped into a transaction
    cancelRevisionRequest: (...args) =>
      prisma.$transaction(prisma =>
        buildCancelRevisionRequest({ prisma, user })(...args)
      ),
    createRevisionRequest: (...args) =>
      prisma.$transaction(prisma =>
        buildCreateRevisionRequest({ prisma, user })(...args)
      ),
    acceptRevisionRequestApproval: buildAcceptRevisionRequestApproval({
      prisma,
      user
    }),
    refuseRevisionRequestApproval: (...args) =>
      prisma.$transaction(prisma =>
        buildRefuseRevisionRequestApproval({ prisma, user })(...args)
      )
  };

  return {
    ...formActions,
    ...formRevisionRequestActions
  };
}
