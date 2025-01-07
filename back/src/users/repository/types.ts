import { FindManyMembershipRequestsFn } from "./membershipRequest/findMany";

export type MembershipRequestActions = {
  // Read
  findMany: FindManyMembershipRequestsFn;
  count: FindManyMembershipRequestsFn;
};
