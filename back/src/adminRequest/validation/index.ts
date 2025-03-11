import {
  CreateAdminRequestInput,
  QueryAdminRequestsArgs,
  MutationRefuseAdminRequestArgs
} from "@td/codegen-back";
import {
  createAdminRequestInputSchema,
  queryAdminRequestsArgsSchema,
  adminRequestIdSchema
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

export const parseMutationRefuseAdminRequestArgs = (
  args: MutationRefuseAdminRequestArgs
) => {
  return adminRequestIdSchema.parse(args);
};
