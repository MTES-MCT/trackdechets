import type { MutationResolvers } from "@td/codegen-back";
import createAdminRequest from "./mutations/createAdminRequest";
import refuseAdminRequest from "./mutations/refuseAdminRequest";

export type AdminRequestMutationResolvers = Pick<
  MutationResolvers,
  "createAdminRequest" | "refuseAdminRequest"
>;

const Mutation: AdminRequestMutationResolvers = {
  createAdminRequest,
  refuseAdminRequest
};

export default Mutation;
