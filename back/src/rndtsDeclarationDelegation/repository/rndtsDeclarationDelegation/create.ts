import { Prisma, RndtsDeclarationDelegation } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { startOfDay, endOfDay, todayAtMidnight } from "../../../utils";

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

    // TODO: good idea? Better than DB? Not good because tests don't use repository..
    const startDate = data.startDate
      ? startOfDay(data.startDate)
      : todayAtMidnight();
    const endDate = data.endDate ? endOfDay(data.endDate) : null;

    const delegation = await prisma.rndtsDeclarationDelegation.create({
      data: {
        // Set default start date to midnight
        ...data,
        startDate,
        endDate
      }
    });

    return delegation;
  };
};
