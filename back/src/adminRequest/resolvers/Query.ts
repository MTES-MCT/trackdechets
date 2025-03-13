import type { QueryResolvers } from "@td/codegen-back";
import adminRequests from "./queries/private/adminRequests";
import adminRequest from "./queries/private/adminRequest";

export type AdminRequestQueryResolvers = Pick<
  QueryResolvers,
  "adminRequests" | "adminRequest"
>;

const Query: AdminRequestQueryResolvers = {
  adminRequests,
  adminRequest
};

export default Query;
