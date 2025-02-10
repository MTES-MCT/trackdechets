import { prisma } from "@td/prisma";
import { MembershipRequestActions } from "./types";
import { buildFindManyMembershipRequest } from "./membershipRequest/findMany";
import { buildCountMembershipRequests } from "./membershipRequest/count";

export type MembershipRequestRepository = MembershipRequestActions;

export function getReadonlyMembershipRequestRepository() {
  return {
    findMany: buildFindManyMembershipRequest({ prisma }),
    count: buildCountMembershipRequests({ prisma })
  };
}

export function getMembershipRequestRepository(): MembershipRequestRepository {
  return {
    ...getReadonlyMembershipRequestRepository()
  };
}
