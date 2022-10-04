import prisma from "../../prisma";
import { RepositoryFnBuilder, RepositoryTransaction } from "./types";

type Callback = Parameters<RepositoryTransaction["addAfterCommitCallback"]>[0];

type RepositoryContext = {
  user: Express.User;
  transaction?: RepositoryTransaction;
};

/**
 * Provide a transaction if not provided
 * and add commit callback to prisma transaction
 * @param builder
 * @param context
 */
export function transactionWrapper<FnResult>(
  builder: RepositoryFnBuilder<FnResult>,
  context: RepositoryContext
) {
  return async (...args) => {
    const callbacks: Callback[] = [];

    const result = context.transaction
      ? await builder({
          user: context.user,
          prisma: {
            ...context.transaction,
            addAfterCommitCallback: callback => {
              callbacks.push(callback);
            }
          }
        })(...args)
      : await runInTransaction(async transaction =>
          builder({
            user: context.user,
            prisma: {
              ...transaction,
              addAfterCommitCallback: callback => {
                callbacks.push(callback);
              }
            }
          })(...args)
        );

    for (const callback of callbacks) {
      try {
        await callback();
      } catch (err) {
        console.error("Transaction callback error", err);
      }
    }

    return result;
  };
}

export async function runInTransaction<F>(
  func: (transaction: RepositoryTransaction) => Promise<F>
) {
  return prisma.$transaction(async transaction => func(transaction));
}
