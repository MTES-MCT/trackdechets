import prisma from "../../prisma";
import { BsdaActions } from "./types";
import { PrismaTransaction } from "../../forms/repository/types";
import { buildFindUniqueBsda } from "./bsda/findUnique";
import { buildCountBsdas } from "./bsda/count";
import { buildCreateBsda } from "./bsda/create";
import { buildDeleteBsda } from "./bsda/delete";
import { buildUpdateBsda } from "./bsda/update";
import { buildUpdateManyBsdas } from "./bsda/updateMany";
import { buildFindManyBsda } from "./bsda/findMany";
import { buildFindRelatedBsdaEntity } from "./bsda/findRelatedEntity";
import { buildCreateRevisionRequest } from "./revisionRequest/create";
import { buildCountRevisionRequests } from "./revisionRequest/count";
import { buildFindUniqueRevisionRequest } from "./revisionRequest/findUnique";
import { buildCancelRevisionRequest } from "./revisionRequest/cancel";
import { buildAcceptRevisionRequestApproval } from "./revisionRequest/accept";
import { buildRefuseRevisionRequestApproval } from "./revisionRequest/refuse";
import { buildFindManyBsdaRevisionRequest } from "./revisionRequest/findMany";

export type BsdaRepository = BsdaActions;

function transactionWrapper<Builder extends (args) => any>(
  user: Express.User,
  transaction: PrismaTransaction | undefined,
  builder: Builder
) {
  return (...args) => {
    if (transaction) {
      return builder({ user, prisma: transaction })(...args);
    }

    return prisma.$transaction(newTransaction =>
      builder({ user, prisma: newTransaction })(...args)
    );
  };
}

export function runInTransaction<F>(
  func: (transaction: PrismaTransaction) => Promise<F>
) {
  return prisma.$transaction(async transaction => func(transaction));
}

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
  transaction?: PrismaTransaction
): BsdaRepository {
  const useTransaction = builder =>
    transactionWrapper(user, transaction, builder);

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
