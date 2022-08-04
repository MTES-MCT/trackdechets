import { RepositoryTransaction } from "../../forms/repository/types";
import prisma from "../../prisma";
import { buildCountBsdas } from "./bsda/count";
import { buildCreateBsda } from "./bsda/create";
import { buildDeleteBsda } from "./bsda/delete";
import { buildFindManyBsda } from "./bsda/findMany";
import { buildFindRelatedBsdaEntity } from "./bsda/findRelatedEntity";
import { buildFindUniqueBsda } from "./bsda/findUnique";
import { buildUpdateBsda } from "./bsda/update";
import { buildUpdateManyBsdas } from "./bsda/updateMany";
import { buildAcceptRevisionRequestApproval } from "./revisionRequest/accept";
import { buildCancelRevisionRequest } from "./revisionRequest/cancel";
import { buildCountRevisionRequests } from "./revisionRequest/count";
import { buildCreateRevisionRequest } from "./revisionRequest/create";
import { buildFindManyBsdaRevisionRequest } from "./revisionRequest/findMany";
import { buildFindUniqueRevisionRequest } from "./revisionRequest/findUnique";
import { buildRefuseRevisionRequestApproval } from "./revisionRequest/refuse";
import { BsdaActions } from "./types";

export type BsdaRepository = BsdaActions;

function transactionWrapper<Builder extends (args) => any>(
  user: Express.User,
  transaction: RepositoryTransaction | undefined,
  builder: Builder
) {
  return (...args) => {
    if (transaction) {
      return builder({ user, prisma: transaction })(...args);
    }

    return runInTransaction(newTransaction =>
      builder({ user, prisma: newTransaction })(...args)
    );
  };
}

type Callback = Parameters<RepositoryTransaction["addAfterCommitCallback"]>[0];

export async function runInTransaction<F>(
  func: (transaction: RepositoryTransaction) => Promise<F>
) {
  const callbacks: Callback[] = [];

  const result = await prisma.$transaction(async transaction =>
    func({
      ...transaction,
      addAfterCommitCallback: callback => {
        callbacks.push(callback);
      }
    })
  );

  for (const callback of callbacks) {
    await callback();
  }

  return result;
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
  transaction?: RepositoryTransaction
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
