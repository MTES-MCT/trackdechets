import { Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type CountMembershipRequestsFn = (
  where: Prisma.MembershipRequestWhereInput
) => Promise<number>;

export function buildCountMembershipRequests({
  prisma
}: ReadRepositoryFnDeps): CountMembershipRequestsFn {
  return where => {
    return prisma.membershipRequest.count({ where });
  };
}
