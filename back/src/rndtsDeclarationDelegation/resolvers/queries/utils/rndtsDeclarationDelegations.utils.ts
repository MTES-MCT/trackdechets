import { getConnection } from "../../../../common/pagination";
import { getRndtsDeclarationDelegationRepository } from "../../../repository";
import { ParsedQueryRndtsDeclarationDelegationsArgs } from "../../../validation";

export const getPaginatedDelegations = async (
  user: Express.User,
  paginationArgs: ParsedQueryRndtsDeclarationDelegationsArgs
) => {
  const delegationRepository = getRndtsDeclarationDelegationRepository(user);

  const { where, after, first } = paginationArgs;

  const fixedWhere = {
    delegateId: where.delegateId ?? undefined,
    delegatorId: where.delegatorId ?? undefined
  };

  const pageSize = Math.max(Math.min(first ?? 0, 50), 10);

  const totalCount = await delegationRepository.count(fixedWhere);

  const result = await getConnection({
    totalCount,
    findMany: prismaPaginationArgs =>
      delegationRepository.findMany(fixedWhere, {
        ...prismaPaginationArgs,
        orderBy: { updatedAt: "desc" },
        include: { delegator: true, delegate: true }
      }),
    formatNode: node => ({ ...node }),
    ...{ after, first: pageSize }
  });

  return result;
};
