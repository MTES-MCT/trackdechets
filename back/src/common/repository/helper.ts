import { RepositoryTransaction } from "../../forms/repository/types";
import prisma from "../../prisma";

export function transactionWrapper<Builder extends (args) => any>(
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
    try {
      await callback();
    } catch (err) {
      console.error("Transaction callback error", err);
    }
  }

  return result;
}
