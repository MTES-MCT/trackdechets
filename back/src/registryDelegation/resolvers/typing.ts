import { RegistryDelegation } from "@td/prisma";
import type { CompanyPublic, RegistryDelegationStatus } from "@td/codegen-back";

// Revolvers don't provide some of the fields, because they are computed
// by sub-resolvers (ie: status or delegate).
// However, Apollo complains that the resolvers are missing said fields.
// With this method we fake providing the sub-fields and Apollo shuts up.
export const fixTyping = (delegation: RegistryDelegation) => {
  return {
    ...delegation,
    delegator: null as unknown as CompanyPublic,
    delegate: null as unknown as CompanyPublic,
    status: null as unknown as RegistryDelegationStatus
  };
};

// Same as above, but for a paginated output
export const fixPaginatedTyping = paginatedDelegations => {
  return {
    ...paginatedDelegations,
    edges: paginatedDelegations.edges.map(edge => ({
      ...edge,
      node: fixTyping(edge.node)
    }))
  };
};
