import { Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindManyMembershipRequestFn = <
  Args extends Omit<Prisma.MembershipRequestFindManyArgs, "where">
>(
  where: Prisma.MembershipRequestWhereInput,
  options?: Args
) => Promise<Array<Prisma.MembershipRequestGetPayload<Args>>>;

export function buildFindManyMembershipRequest({
  prisma
}: ReadRepositoryFnDeps): FindManyMembershipRequestFn {
  return async <
    Args extends Omit<Prisma.MembershipRequestFindManyArgs, "where">
  >(
    where: Prisma.MembershipRequestWhereInput,
    options?: Args
  ) => {
    const input = { where, ...options };
    const membershipRequests = await prisma.membershipRequest.findMany(input);
    return membershipRequests as Array<
      Prisma.MembershipRequestGetPayload<Args>
    >;
  };
}
