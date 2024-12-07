import type { RegistryDelegationResolvers } from "@td/codegen-back";
import { delegateResolver } from "./delegate";
import { delegatorResolver } from "./delegator";
import { statusResolver } from "./status";

const registryDelegationResolvers: RegistryDelegationResolvers = {
  status: statusResolver,
  delegate: delegateResolver,
  delegator: delegatorResolver
};

export default registryDelegationResolvers;
