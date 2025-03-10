import {
  CreateAdminRequestInput,
  QueryAdminRequestsArgs
} from "@td/codegen-back";
import {
  createAdminRequestInputSchema,
  queryAdminRequestsArgsSchema
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
