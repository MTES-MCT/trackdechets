import { prisma } from "@td/prisma";
import { buildCountBsdas } from "./bsda/count";
import { buildCreateBsda } from "./bsda/create";
import { buildDeleteBsda } from "./bsda/delete";
import { buildFindManyBsda } from "./bsda/findMany";
import { buildFindRelatedBsdaEntity } from "./bsda/findRelatedEntity";
import { buildFindUniqueBsda } from "./bsda/findUnique";
import { buildUpdateBsda } from "./bsda/update";
import { buildUpdateManyBsdas } from "./bsda/updateMany";
import { transactionWrapper } from "../../common/repository/helper";
import { buildAcceptRevisionRequestApproval } from "./revisionRequest/accept";
import { buildCancelRevisionRequest } from "./revisionRequest/cancel";
import { buildCountRevisionRequests } from "./revisionRequest/count";
import { buildCreateRevisionRequest } from "./revisionRequest/create";
import { buildFindManyBsdaRevisionRequest } from "./revisionRequest/findMany";
import { buildFindUniqueRevisionRequest } from "./revisionRequest/findUnique";
import { buildRefuseRevisionRequestApproval } from "./revisionRequest/refuse";
import { BsdaActions } from "./types";
import {
  RepositoryFnBuilder,
  RepositoryTransaction
} from "../../common/repository/types";

export type BsdaRepository = BsdaActions;

export function getReadonlyBsdaRepository() {
  return {
    count: buildCountBsdas({ prisma }),
    findUnique: buildFindUniqueBsda({ prisma }),
    findMany: buildFindManyBsda({ prisma }),
    findRelatedEntity: buildFindRelatedBsdaEntity({ prisma }),
    countRevisionRequests: buildCountRevisionRequests({ prisma }),
    findUniqueRevisionRequest: buildFindUniqueRevisionRequest({ prisma }),
    findManyBsdaRevisionRequest: buildFindManyBsdaRevisionRequest({ prisma })
  };
}

export function getBsdaRepository(
  user: Express.User,
  transaction?: RepositoryTransaction
): BsdaRepository {
  function useTransaction<FnResult>(builder: RepositoryFnBuilder<FnResult>) {
    return transactionWrapper(builder, { user, transaction });
  }

  return {
    ...getReadonlyBsdaRepository(),
    create: useTransaction(buildCreateBsda),
    delete: useTransaction(buildDeleteBsda),
    update: useTransaction(buildUpdateBsda),
    updateMany: useTransaction(buildUpdateManyBsdas),
    createRevisionRequest: useTransaction(buildCreateRevisionRequest),
    cancelRevisionRequest: useTransaction(buildCancelRevisionRequest),
    acceptRevisionRequestApproval: useTransaction(
      buildAcceptRevisionRequestApproval
    ),
    refuseRevisionRequestApproval: useTransaction(
      buildRefuseRevisionRequestApproval
    )
  };
}
