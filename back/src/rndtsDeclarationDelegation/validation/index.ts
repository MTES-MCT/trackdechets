import {
  CreateRndtsDeclarationDelegationInput,
  MutationRevokeRndtsDeclarationDelegationArgs,
  QueryRndtsDeclarationDelegationArgs
} from "../../generated/graphql/types";
import {
  delegationIdSchema,
  createRndtsDeclarationDelegationInputSchema
} from "./schema";

export function parseCreateRndtsDeclarationDelegationInput(
  input: CreateRndtsDeclarationDelegationInput
) {
  return createRndtsDeclarationDelegationInputSchema.parse(input);
}

export type ParsedCreateRndtsDeclarationDelegationInput = ReturnType<
  typeof parseCreateRndtsDeclarationDelegationInput
>;

export function parseQueryRndtsDeclarationDelegationArgs(
  args: QueryRndtsDeclarationDelegationArgs
) {
  return delegationIdSchema.parse(args);
}

export function parseMutationRevokeRndtsDeclarationDelegationArgs(
  args: MutationRevokeRndtsDeclarationDelegationArgs
) {
  return delegationIdSchema.parse(args);
}
