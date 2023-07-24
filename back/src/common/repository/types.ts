import { PrismaClient } from "@prisma/client";

export type PrismaTransaction = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;
export type RepositoryTransaction = PrismaTransaction & {
  addAfterCommitCallback: (callback: () => void | Promise<void>) => void;
};

export type ReadRepositoryFnDeps = { prisma: PrismaTransaction };
export type WriteRepositoryFnDeps = {
  prisma: RepositoryTransaction;
  user: Express.User;
};
export type RepositoryFnDeps = WriteRepositoryFnDeps;

export interface RepositoryDeps {
  prisma: PrismaClient;
  user: Express.User;
}

export type RepositoryFnBuilder<FnResult> = (
  deps: RepositoryFnDeps
) => (...args) => Promise<FnResult>;

export type LogMetadata = Record<string, unknown>;
