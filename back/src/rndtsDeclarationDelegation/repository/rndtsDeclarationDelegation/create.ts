import { Prisma, RndtsDeclarationDelegation } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { todayAtMidnight } from "../../../utils";

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export type CreateRndtsDeclarationDelegationFn = (
  data: Optional<Prisma.RndtsDeclarationDelegationCreateInput, "startDate">,
  logMetadata?: LogMetadata
) => Promise<RndtsDeclarationDelegation>;

export const buildCreateRndtsDeclarationDelegation = (
  deps: RepositoryFnDeps
): CreateRndtsDeclarationDelegationFn => {
  return async data => {
    const { prisma } = deps;

    const delegation = await prisma.rndtsDeclarationDelegation.create({
      data: {
        // Set default start date to midnight
        // TODO: good idea? Better than DB?
        startDate: todayAtMidnight(),
        ...data
      }
    });

    return delegation;
  };
};
