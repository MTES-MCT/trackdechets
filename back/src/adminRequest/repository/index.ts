import { prisma } from "@td/prisma";
import { buildCreateAdminRequest } from "./adminRequest/create";
import { transactionWrapper } from "../../common/repository/helper";
import {
  RepositoryFnBuilder,
  RepositoryTransaction
} from "../../common/repository/types";
import { AdminRequestActions } from "./types";
import buildFindFirstAdminRequest from "./adminRequest/findFirst";
import { buildUpdateAdminRequest } from "./adminRequest/update";
import { buildFindManyAdminRequest } from "./adminRequest/findMany";

export type AdminRequestRepository = AdminRequestActions;

export function getReadonlyAdminRequestRepository() {
  return {
    findFirst: buildFindFirstAdminRequest({ prisma }),
    findMany: buildFindManyAdminRequest({ prisma })
  };
}

export function getAdminRequestRepository(
  user: Express.User,
  transaction?: RepositoryTransaction
): AdminRequestRepository {
  function useTransaction<FnResult>(builder: RepositoryFnBuilder<FnResult>) {
    return transactionWrapper(builder, { user, transaction });
  }

  return {
    ...getReadonlyAdminRequestRepository(),
    create: useTransaction(buildCreateAdminRequest),
    update: useTransaction(buildUpdateAdminRequest)
  };
}
