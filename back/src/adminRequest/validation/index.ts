import {
  CreateAdminRequestInput,
  AcceptAdminRequestInput,
  QueryAdminRequestsArgs,
  QueryAdminRequestArgs,
  MutationRefuseAdminRequestArgs,
  QueryAdminRequestsAdminArgs
} from "@td/codegen-back";
import {
  createAdminRequestInputSchema,
  queryAdminRequestsArgsSchema,
  adminRequestIdSchema,
  acceptAdminRequestInputSchema,
  queryAdminRequestsAdminArgsSchema
} from "./schema";

export const parseCreateAdminRequestInput = (
  input: CreateAdminRequestInput
) => {
  return createAdminRequestInputSchema.parse(input);
};

export type ParsedCreateAdminRequestInput = ReturnType<
  typeof parseCreateAdminRequestInput
>;

export function parseQueryAdminRequestsArgs(args: QueryAdminRequestsArgs) {
  return queryAdminRequestsArgsSchema.parse(args);
}

export type ParsedQueryAdminRequestsArgs = ReturnType<
  typeof parseQueryAdminRequestsArgs
>;

export function parseQueryAdminRequestsAdminArgs(
  args: QueryAdminRequestsAdminArgs
) {
  return queryAdminRequestsAdminArgsSchema.parse(args);
}

export type ParsedQueryAdminRequestsAdminArgs = ReturnType<
  typeof parseQueryAdminRequestsAdminArgs
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
