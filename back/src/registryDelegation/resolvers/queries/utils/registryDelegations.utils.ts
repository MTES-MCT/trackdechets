import { Company } from "@prisma/client";
import {
  getConnection,
  getPrismaPaginationArgs
} from "../../../../common/pagination";
import { getRegistryDelegationRepository } from "../../../repository";
import { UserInputError } from "../../../../common/errors";

interface Args {
  delegate?: Company;
  delegator?: Company;
  skip?: number | null | undefined;
  first?: number | null | undefined;
}

export const getPaginatedDelegations = async (
  user: Express.User,
  { delegate, delegator, skip, first }: Args
) => {
  if (!delegate && !delegator) {
    throw new UserInputError(
      "Vous devez préciser un délégant ou un délégataire"
    );
  }

  const delegationRepository = getRegistryDelegationRepository(user);

  const fixedWhere = {
    delegateId: delegate?.id,
    delegatorId: delegator?.id
  };

  const totalCount = await delegationRepository.count(fixedWhere);

  const paginationArgs = getPrismaPaginationArgs({
    skip: skip ?? 0,
    first: first ?? 10
  });

  const result = await getConnection({
    totalCount,
    findMany: () =>
      delegationRepository.findMany(fixedWhere, {
        ...paginationArgs,
        orderBy: { updatedAt: "desc" },
        include: { delegator: true, delegate: true }
      }),
    formatNode: node => ({ ...node })
  });

  return result;
};
