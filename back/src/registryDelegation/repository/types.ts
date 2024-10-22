import { CountRegistryDelegationsFn } from "./registryDelegation/count";
import { CreateRegistryDelegationFn } from "./registryDelegation/create";
import { FindFirstRegistryDelegationFn } from "./registryDelegation/findFirst";
import { FindManyRegistryDelegationFn } from "./registryDelegation/findMany";
import { UpdateRegistryDelegationFn } from "./registryDelegation/update";

export type RegistryDelegationActions = {
  // Read
  findFirst: FindFirstRegistryDelegationFn;
  count: CountRegistryDelegationsFn;
  findMany: FindManyRegistryDelegationFn;

  // Write
  create: CreateRegistryDelegationFn;
  update: UpdateRegistryDelegationFn;
};
