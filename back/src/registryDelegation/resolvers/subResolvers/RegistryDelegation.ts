import { RegistryDelegationResolvers } from "../../../generated/graphql/types";
import { delegateResolver } from "./delegate";
import { delegatorResolver } from "./delegator";
import { statusResolver } from "./status";

const registryDelegationResolvers: RegistryDelegationResolvers = {
  status: statusResolver,
  delegate: delegateResolver,
  delegator: delegatorResolver
};

export default registryDelegationResolvers;
