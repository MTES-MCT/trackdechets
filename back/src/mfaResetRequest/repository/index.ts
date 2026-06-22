import { prisma } from "@td/prisma";
import { buildCreateMfaResetRequest } from "./mfaResetRequest/create";
import { buildFindFirstMfaResetRequest } from "./mfaResetRequest/findFirst";
import { buildFindManyMfaResetRequest } from "./mfaResetRequest/findMany";
import { buildUpdateMfaResetRequest } from "./mfaResetRequest/update";
import { buildCountMfaResetRequests } from "./mfaResetRequest/count";
import { transactionWrapper } from "../../common/repository/helper";
import {
  RepositoryFnBuilder,
  RepositoryTransaction
} from "../../common/repository/types";
import { MfaResetRequestActions } from "./types";

export type MfaResetRequestRepository = MfaResetRequestActions;

export function getReadonlyMfaResetRequestRepository() {
  return {
    findFirst: buildFindFirstMfaResetRequest({ prisma }),
    findMany: buildFindManyMfaResetRequest({ prisma }),
    count: buildCountMfaResetRequests({ prisma })
  };
}

export function getMfaResetRequestRepository(
  user: Express.User,
  transaction?: RepositoryTransaction
): MfaResetRequestRepository {
  function withTransaction<FnResult>(builder: RepositoryFnBuilder<FnResult>) {
    return transactionWrapper(builder, { user, transaction });
  }

  return {
    ...getReadonlyMfaResetRequestRepository(),
    create: withTransaction(buildCreateMfaResetRequest),
    update: withTransaction(buildUpdateMfaResetRequest)
  };
}
