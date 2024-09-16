import {
  CreateRndtsDeclarationDelegationInput,
  MutationRevokeRndtsDeclarationDelegationArgs,
  QueryRndtsDeclarationDelegationArgs,
  QueryRndtsDeclarationDelegationsArgs
} from "../../generated/graphql/types";
import {
  delegationIdSchema,
  createRndtsDeclarationDelegationInputSchema,
  queryRndtsDeclarationDelegationsArgsSchema
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

export function parseQueryRndtsDeclarationDelegationsArgs(
  args: QueryRndtsDeclarationDelegationsArgs
) {
  return queryRndtsDeclarationDelegationsArgsSchema.parse(args);
}

export type ParsedQueryRndtsDeclarationDelegationsArgs = ReturnType<
  typeof parseQueryRndtsDeclarationDelegationsArgs
>;
