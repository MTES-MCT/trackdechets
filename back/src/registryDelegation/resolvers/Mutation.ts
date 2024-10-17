import { MutationResolvers } from "../../generated/graphql/types";
import cancelRegistryDelegation from "./mutations/cancelRegistryDelegation";
import createRegistryDelegation from "./mutations/createRegistryDelegation";
import revokeRegistryDelegation from "./mutations/revokeRegistryDelegation";

export type RegistryDelegationMutationResolvers = Pick<
  MutationResolvers,
  | "createRegistryDelegation"
  | "revokeRegistryDelegation"
  | "cancelRegistryDelegation"
>;

const Mutation: RegistryDelegationMutationResolvers = {
  createRegistryDelegation,
  revokeRegistryDelegation,
  cancelRegistryDelegation
};

export default Mutation;
