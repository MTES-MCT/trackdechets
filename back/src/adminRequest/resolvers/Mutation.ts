import type { MutationResolvers } from "@td/codegen-back";
import createAdminRequest from "./mutations/createAdminRequest";
import refuseAdminRequest from "./mutations/refuseAdminRequest";
import acceptAdminRequest from "./mutations/acceptAdminRequest";

export type AdminRequestMutationResolvers = Pick<
  MutationResolvers,
  "createAdminRequest" | "refuseAdminRequest" | "acceptAdminRequest"
>;

const Mutation: AdminRequestMutationResolvers = {
  createAdminRequest,
  refuseAdminRequest,
  acceptAdminRequest
};

export default Mutation;
