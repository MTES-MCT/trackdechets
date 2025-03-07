import type { MutationResolvers } from "@td/codegen-back";
import createAdminRequest from "./mutations/createAdminRequest";

export type AdminRequestMutationResolvers = Pick<
  MutationResolvers,
  "createAdminRequest"
>;

const Mutation: AdminRequestMutationResolvers = {
  createAdminRequest
};

export default Mutation;
