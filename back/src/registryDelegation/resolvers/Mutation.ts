import { MutationResolvers } from "../../generated/graphql/types";
import createRegistryDelegation from "./mutations/createRegistryDelegation";
import revokeRegistryDelegation from "./mutations/revokeRegistryDelegation";

export type RegistryDelegationMutationResolvers = Pick<
  MutationResolvers,
  "createRegistryDelegation" | "revokeRegistryDelegation"
>;

const Mutation: RegistryDelegationMutationResolvers = {
  createRegistryDelegation,
  revokeRegistryDelegation
};

export default Mutation;
