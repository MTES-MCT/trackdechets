import { Company } from "@prisma/client";
import {
  MutationUpdateCompanyArgs,
  PrivateCompanyInput
} from "../../generated/graphql/types";
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
