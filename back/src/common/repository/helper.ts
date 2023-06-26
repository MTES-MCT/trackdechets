import logger from "../../logging/logger";
import prisma from "../../prisma";
import { RepositoryFnBuilder, RepositoryTransaction } from "./types";

type Callback = Parameters<RepositoryTransaction["addAfterCommitCallback"]>[0];

type RepositoryContext = {
  user: Express.User;
  transaction?: RepositoryTransaction;
};

// See https://www.prisma.io/docs/concepts/components/prisma-client/transactions#interactive-transactions-in-preview
export const PRISMA_TRANSACTION_TIMEOUT =
  parseInt(process.env.PRISMA_TRANSACTION_TIMEOUT, 10) || 5000;

/**
 * Wrapper to provide a transaction if not provided from context
 */
export function transactionWrapper<FnResult>(
  builder: RepositoryFnBuilder<FnResult>,
  { user, transaction }: RepositoryContext
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

/**
 * Wrapper to run a function in transaction and add an `addAfterCommitCallback`
 * to the transaction object
 */
export async function runInTransaction<F>(
  func: (transaction: RepositoryTransaction) => Promise<F>
) {
  const callbacks: Callback[] = [];

  const result = await prisma.$transaction(
    async transaction =>
      func({
        ...transaction,
        addAfterCommitCallback: callback => {
          callbacks.push(callback);
        }
      }),
    { timeout: PRISMA_TRANSACTION_TIMEOUT }
  );

  for (const callback of callbacks) {
    try {
      await callback();
    } catch (err) {
      logger.error("Transaction callback error", err);
    }
  }

  return result;
}
