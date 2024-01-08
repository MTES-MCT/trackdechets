import { transactionWrapper } from "../../common/repository/helper";
import {
  RepositoryFnBuilder,
  RepositoryTransaction
} from "../../common/repository/types";
import { prisma } from "@td/prisma";
import buildCountForms from "./form/count";
import buildCreateForm from "./form/create";
import buildDeleteForm from "./form/delete";
import buildDeleteFormStaleSegments from "./form/deleteStaleSegments";
import buildFindFirstForm from "./form/findFirst";
import buildFindForwardedInById from "./form/findForwardedInById";
import buildFindFullFormById from "./form/findFullFormById";
import buildFindGroupedFormsById from "./form/findGroupedFormsById";
import buildFindUniqueForm from "./form/findUnique";
import buildRemoveAppendix2 from "./form/removeAppendix2";
import { buildSetAppendix1 } from "./form/setAppendix1";
import buildSetAppendix2 from "./form/setAppendix2";
import buildUpdateForm from "./form/update";
import { buildUpdateAppendix1Forms } from "./form/updateAppendix1Forms";
import buildUpdateAppendix2Forms from "./form/updateAppendix2Forms";
import buildUpdateManyForms from "./form/updateMany";
import buildAcceptRevisionRequestApproval from "./formRevisionRequest/acceptRevisionRequestApproval";
import buildCancelRevisionRequest from "./formRevisionRequest/cancelRevisionRequest";
import buildCountRevisionRequests from "./formRevisionRequest/countRevisionRequest";
import buildCreateRevisionRequest from "./formRevisionRequest/createRevisionRequest";
import buildGetRevisionRequestById from "./formRevisionRequest/getRevisionRequestById";
import buildRefuseRevisionRequestApproval from "./formRevisionRequest/refuseRevisionRequestApproval";
import { FormActions, FormRevisionRequestActions } from "./types";

export type FormRepository = FormActions & FormRevisionRequestActions;

export function getReadOnlyFormRepository() {
  return {
    findUnique: buildFindUniqueForm({ prisma }),
    findFirst: buildFindFirstForm({ prisma }),
    findFullFormById: buildFindFullFormById({ prisma }),
    findGroupedFormsById: buildFindGroupedFormsById({ prisma }),
    findForwardedInById: buildFindForwardedInById({ prisma }),
    count: buildCountForms({ prisma })
  };
}

export function getFormRepository(
  user: Express.User,
  transaction?: RepositoryTransaction
): FormRepository {
  function useTransaction<FnResult>(builder: RepositoryFnBuilder<FnResult>) {
    return transactionWrapper(builder, { user, transaction });
  }

  const formActions: FormActions = {
    // READ operations
    ...getReadOnlyFormRepository(),
    // WRITE OPERATIONS - wrapped into a transaction
    create: useTransaction(buildCreateForm),
    update: useTransaction(buildUpdateForm),
    updateMany: useTransaction(buildUpdateManyForms),
    delete: useTransaction(buildDeleteForm),
    removeAppendix2: useTransaction(buildRemoveAppendix2),
    setAppendix1: useTransaction(buildSetAppendix1),
    setAppendix2: useTransaction(buildSetAppendix2),
    updateAppendix1Forms: useTransaction(buildUpdateAppendix1Forms),
    updateAppendix2Forms: useTransaction(buildUpdateAppendix2Forms),
    deleteStaleSegments: useTransaction(buildDeleteFormStaleSegments)
  };

  const formRevisionRequestActions: FormRevisionRequestActions = {
    // READ operations
    getRevisionRequestById: buildGetRevisionRequestById({ prisma }),
    countRevisionRequests: buildCountRevisionRequests({ prisma }),
    // WRITE operations - wrapped into a transaction
    cancelRevisionRequest: useTransaction(buildCancelRevisionRequest),
    createRevisionRequest: useTransaction(buildCreateRevisionRequest),
    acceptRevisionRequestApproval: useTransaction(
      buildAcceptRevisionRequestApproval
    ),
    refuseRevisionRequestApproval: useTransaction(
      buildRefuseRevisionRequestApproval
    )
  };

  return {
    ...formActions,
    ...formRevisionRequestActions
  };
}
