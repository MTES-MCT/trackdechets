import { Prisma } from "@prisma/client";

export type FindActiveRndtsDeclarationDelegationFn = <
  Args extends Omit<Prisma.RndtsDeclarationDelegationFindFirstArgs, "where">
>(
  where: Prisma.RndtsDeclarationDelegationWhereInput,
  options?: Args
) => Promise<Prisma.RndtsDeclarationDelegationGetPayload<Args>>;

export const buildFindActiveRndtsDeclarationDelegation = ({
  prisma
}): FindActiveRndtsDeclarationDelegationFn => {
  return async <
    Args extends Omit<Prisma.RndtsDeclarationDelegationFindFirstArgs, "where">
  >(
    where: Prisma.RndtsDeclarationDelegationWhereInput
  ) => {
    const NOW = new Date();

    const delegation = await prisma.rndtsDeclarationDelegation.findFirst({
      where: {
        delegatorOrgId: where.delegatorOrgId,
        delegateOrgId: where.delegateOrgId,
        isAccepted: true,
        validityStartDate: { lte: NOW },
        OR: [{ validityEndDate: null }, { validityEndDate: { gt: NOW } }]
      }
    });

    return delegation as Prisma.RndtsDeclarationDelegationGetPayload<Args>;
  };
};
