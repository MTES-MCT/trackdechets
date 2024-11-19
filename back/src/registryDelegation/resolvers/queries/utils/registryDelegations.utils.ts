import { Company, Prisma } from "@prisma/client";
import {
  getConnection,
  getPrismaPaginationArgs
} from "../../../../common/pagination";
import { getRegistryDelegationRepository } from "../../../repository";
import { UserInputError } from "../../../../common/errors";

interface Args {
  delegates: Company[];
  delegator?: Company;
  activeOnly?: boolean | null;
  search?: string | null;
  skip?: number | null | undefined;
  first?: number | null | undefined;
}

export const getPaginatedDelegations = async (
  user: Express.User,
  { delegates, delegator, activeOnly, search, skip, first }: Args
) => {
  if (delegates.length === 0 && !delegator) {
    throw new UserInputError(
      "Vous devez préciser un délégant ou un délégataire"
    );
  }

  const delegationRepository = getRegistryDelegationRepository(user);

  const fixedWhere: Prisma.RegistryDelegationWhereInput = {
    delegateId: delegates.length
      ? { in: delegates.map(delegate => delegate.id) }
      : undefined,
    ...(activeOnly && {
      revokedBy: null,
      cancelledBy: null,
      startDate: { lte: new Date() },
      OR: [{ endDate: null }, { endDate: { gt: new Date() } }]
    }),
    ...(search
      ? {
          delegator: {
            ...(delegator && { id: delegator?.id }),
            OR: [
              {
                name: { contains: search!, mode: "insensitive" }
              },
              {
                givenName: { contains: search!, mode: "insensitive" }
              },
              {
                siret: { contains: search!, mode: "insensitive" }
              }
            ]
          }
        }
      : { delegatorId: delegator?.id })
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
