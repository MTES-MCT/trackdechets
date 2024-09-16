import { CountRndtsDeclarationDelegationsFn } from "./rndtsDeclarationDelegation/count";
import { CreateRndtsDeclarationDelegationFn } from "./rndtsDeclarationDelegation/create";
import { FindFirstRndtsDeclarationDelegationFn } from "./rndtsDeclarationDelegation/findFirst";
import { FindManyRndtsDeclarationDelegationFn } from "./rndtsDeclarationDelegation/findMany";
import { UpdateRndtsDeclarationDelegationFn } from "./rndtsDeclarationDelegation/update";

export type RndtsDeclarationDelegationActions = {
  // Read
  findFirst: FindFirstRndtsDeclarationDelegationFn;
  count: CountRndtsDeclarationDelegationsFn;
  findMany: FindManyRndtsDeclarationDelegationFn;

  // Write
  create: CreateRndtsDeclarationDelegationFn;
  update: UpdateRndtsDeclarationDelegationFn;
};
