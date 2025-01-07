import { FindManyMembershipRequestsFn } from "./membershipRequest/findMany";
import { CountMembershipRequestsFn } from "./membershipRequest/count";

export type MembershipRequestActions = {
  // Read
  findMany: FindManyMembershipRequestsFn;
  count: CountMembershipRequestsFn;
};
