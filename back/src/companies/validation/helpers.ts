import type { PrivateCompanyInput } from "@td/codegen-back";
import { ZodCompany } from "./schema";

export function companyInputToZodCompany(
  input: PrivateCompanyInput
): ZodCompany {
  return {
    ...input,
    name: input.companyName,
    ecoOrganismeAgreements: (input.ecoOrganismeAgreements ?? []).map(
      e => e.href
    )
  };
}
