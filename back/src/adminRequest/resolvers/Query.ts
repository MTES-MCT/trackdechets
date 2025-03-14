import type { QueryResolvers } from "@td/codegen-back";
import adminRequests from "./queries/private/adminRequests";
import adminRequest from "./queries/private/adminRequest";
import adminRequestsAdmin from "./queries/private/adminRequestsAdmin";

export type AdminRequestQueryResolvers = Pick<
  QueryResolvers,
  "adminRequests" | "adminRequest" | "adminRequestsAdmin"
>;

const Query: AdminRequestQueryResolvers = {
  adminRequests,
  adminRequest,
  adminRequestsAdmin
};

export default Query;
