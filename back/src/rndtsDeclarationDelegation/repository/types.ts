import { CreateRndtsDeclarationDelegationFn } from "./rndtsDeclarationDelegation/create";
import { FindFirstRndtsDeclarationDelegationFn } from "./rndtsDeclarationDelegation/findFirst";
import { UpdateRndtsDeclarationDelegationFn } from "./rndtsDeclarationDelegation/update";

export type RndtsDeclarationDelegationActions = {
  // Read
  findFirst: FindFirstRndtsDeclarationDelegationFn;

  // Write
  create: CreateRndtsDeclarationDelegationFn;
  update: UpdateRndtsDeclarationDelegationFn;
};
