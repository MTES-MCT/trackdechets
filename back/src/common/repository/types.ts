import { PrismaClient } from "@prisma/client";

export type PrismaTransaction = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use"
>;
export type RepositoryTransaction = PrismaTransaction & {
  addAfterCommitCallback?: (callback: () => void | Promise<void>) => void;
};

export type ReadRepositoryFnDeps = { prisma: RepositoryTransaction };
export type WriteRepositoryFnDeps = ReadRepositoryFnDeps & {
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
