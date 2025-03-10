import type { QueryResolvers } from "@td/codegen-back";
import adminRequests from "./queries/private/adminRequests";

export type AdminRequestQueryResolvers = Pick<QueryResolvers, "adminRequests">;

const Query: AdminRequestQueryResolvers = {
  adminRequests
};

export default Query;
