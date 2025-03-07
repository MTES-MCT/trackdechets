import { CreateAdminRequestInput } from "@td/codegen-back";
import { createAdminRequestInputSchema } from "./schema";

export const parseCreateAdminRequestInput = (
  input: CreateAdminRequestInput
) => {
  return createAdminRequestInputSchema.parse(input);
};
