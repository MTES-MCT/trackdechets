import { AdminRequest, Company, User } from "@prisma/client";
import type { AdminRequestCompany, AdminRequestUser } from "@td/codegen-back";

// Revolvers don't provide some of the fields, because they are computed
// by sub-resolvers (ie: company).
// However, Apollo complains that the resolvers are missing said fields.
// With this method we fake providing the sub-fields and Apollo shuts up.
export const fixTyping = (adminRequest: AdminRequest) => {
  return {
    ...adminRequest,
    company: null as unknown as AdminRequestCompany,
    user: null as unknown as AdminRequestUser
  };
};

// Same as above, but for a paginated output
export const fixPaginatedTyping = paginatedAdminRequests => {
  return {
    ...paginatedAdminRequests,
    edges: paginatedAdminRequests.edges.map(edge => ({
      ...edge,
      node: fixTyping(edge.node)
    }))
  };
};

export interface AdminRequestWithUserAndCompany extends AdminRequest {
  user: User;
  company: Company;
}
