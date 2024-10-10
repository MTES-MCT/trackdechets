import { QueryResolvers } from "../../generated/graphql/types";
import registryDelegation from "./queries/registryDelegation";
import registryDelegations from "./queries/registryDelegations";

export type RegistryDelegationQueryResolvers = Pick<
  QueryResolvers,
  "registryDelegation" | "registryDelegations"
>;

const Query: RegistryDelegationQueryResolvers = {
  registryDelegation,
  registryDelegations
};

export default Query;
