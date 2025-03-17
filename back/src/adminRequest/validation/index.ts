import {
  CreateAdminRequestInput,
  AcceptAdminRequestInput,
  QueryAdminRequestsArgs,
  QueryAdminRequestArgs,
  MutationRefuseAdminRequestArgs
} from "@td/codegen-back";
import {
  createAdminRequestInputSchema,
  queryAdminRequestsArgsSchema,
  adminRequestIdSchema,
  acceptAdminRequestInputSchema
} from "./schema";

export const parseCreateAdminRequestInput = (
  input: CreateAdminRequestInput
) => {
  return createAdminRequestInputSchema.parse(input);
};

export function parseQueryAdminRequestsArgs(args: QueryAdminRequestsArgs) {
  return queryAdminRequestsArgsSchema.parse(args);
}

export type ParsedQueryAdminRequestsArgs = ReturnType<
  typeof parseQueryAdminRequestsArgs
>;

export function parseQueryAdminRequestArgs(args: QueryAdminRequestArgs) {
  return adminRequestIdSchema.parse(args);
}

export type ParsedQueryAdminRequestArgs = ReturnType<
  typeof parseQueryAdminRequestsArgs
>;

export const parseMutationRefuseAdminRequestArgs = (
  args: MutationRefuseAdminRequestArgs
) => {
  return adminRequestIdSchema.parse(args);
};

export const parseAcceptAdminRequestInput = (
  input: AcceptAdminRequestInput
) => {
  return acceptAdminRequestInputSchema.parse(input);
};

export type ParsedAcceptAdminRequestInput = ReturnType<
  typeof parseAcceptAdminRequestInput
>;
