import { CreateRndtsDeclarationDelegationFn } from "./rndtsDeclarationDelegation/create";
import { FindFirstRndtsDeclarationDelegationFn } from "./rndtsDeclarationDelegation/findFirst";

export type RndtsDeclarationDelegationActions = {
  // Read
  findFirst: FindFirstRndtsDeclarationDelegationFn;

  // Write
  create: CreateRndtsDeclarationDelegationFn;
};
