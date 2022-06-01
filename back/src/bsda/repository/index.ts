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

export type BsdaRepository = BsdaActions;

function transactionWrapper<Builder extends Function>(
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
    findUnique: buildFindUniqueBsda({ prisma }),
    findMany: buildFindManyBsda({ prisma }),
    findRelatedEntity: buildFindRelatedBsdaEntity({ prisma })
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
    count: buildCountBsdas({ prisma, user }),
    create: useTransaction(buildCreateBsda),
    delete: useTransaction(buildDeleteBsda),
    update: useTransaction(buildUpdateBsda),
    updateMany: useTransaction(buildUpdateManyBsdas)
  };
}
