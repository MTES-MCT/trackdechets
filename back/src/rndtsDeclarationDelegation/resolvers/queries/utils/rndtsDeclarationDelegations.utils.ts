import { Company } from "@prisma/client";
import { getConnection } from "../../../../common/pagination";
import { getRndtsDeclarationDelegationRepository } from "../../../repository";
import { UserInputError } from "../../../../common/errors";

interface Args {
  delegate?: Company;
  delegator?: Company;
  after?: string | null | undefined;
  first?: number | null | undefined;
}

export const getPaginatedDelegations = async (
  user: Express.User,
  { delegate, delegator, after, first }: Args
) => {
  if (!delegate && !delegator) {
    throw new UserInputError(
      "Vous devez préciser un délégant ou un délégataire"
    );
  }

  const delegationRepository = getRndtsDeclarationDelegationRepository(user);

  const fixedWhere = {
    delegateId: delegate?.id,
    delegatorId: delegator?.id
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
