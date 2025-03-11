import { getAdminRequestRepository } from "../../../../repository";
import {
  getConnection,
  getPrismaPaginationArgs
} from "../../../../../common/pagination";

interface Args {
  skip?: number | null | undefined;
  first?: number | null | undefined;
}

export const getPaginatedDelegations = async (
  user: Express.User,
  { skip, first }: Args
) => {
  const delegationRepository = getAdminRequestRepository(user);

  const where = { userId: user.id };

  const totalCount = await delegationRepository.count(where);

  const paginationArgs = getPrismaPaginationArgs({
    skip: skip ?? 0,
    first: first ?? 10
  });

  const result = await getConnection({
    totalCount,
    findMany: () =>
      delegationRepository.findMany(where, {
        ...paginationArgs,
        orderBy: { updatedAt: "desc" },
        include: { company: true }
      }),
    formatNode: node => node
  });

  return result;
};
