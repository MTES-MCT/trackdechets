import { CreateRndtsDeclarationDelegationFn } from "./rndtsDeclarationDelegation/create";
import { FindActiveRndtsDeclarationDelegationFn } from "./rndtsDeclarationDelegation/findActive";
import { FindFirstRndtsDeclarationDelegationFn } from "./rndtsDeclarationDelegation/findFirst";

export type RndtsDeclarationDelegationActions = {
  // Read
  findActive: FindActiveRndtsDeclarationDelegationFn;
  findFirst: FindFirstRndtsDeclarationDelegationFn;

  // Write
  create: CreateRndtsDeclarationDelegationFn;
};
