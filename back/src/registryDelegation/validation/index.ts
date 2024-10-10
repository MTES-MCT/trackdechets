import {
  CreateRegistryDelegationInput,
  MutationRevokeRegistryDelegationArgs,
  QueryRegistryDelegationArgs,
  QueryRegistryDelegationsArgs
} from "../../generated/graphql/types";
import {
  delegationIdSchema,
  createRegistryDelegationInputSchema,
  queryRegistryDelegationsArgsSchema
} from "./schema";

export function parseCreateRegistryDelegationInput(
  input: CreateRegistryDelegationInput
) {
  return createRegistryDelegationInputSchema.parse(input);
}

export type ParsedCreateRegistryDelegationInput = ReturnType<
  typeof parseCreateRegistryDelegationInput
>;

export function parseQueryRegistryDelegationArgs(
  args: QueryRegistryDelegationArgs
) {
  return delegationIdSchema.parse(args);
}

export function parseMutationRevokeRegistryDelegationArgs(
  args: MutationRevokeRegistryDelegationArgs
) {
  return delegationIdSchema.parse(args);
}

export function parseQueryRegistryDelegationsArgs(
  args: QueryRegistryDelegationsArgs
) {
  return queryRegistryDelegationsArgsSchema.parse(args);
}

export type ParsedQueryRegistryDelegationsArgs = ReturnType<
  typeof parseQueryRegistryDelegationsArgs
>;
