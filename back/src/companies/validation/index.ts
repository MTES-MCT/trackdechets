import { companySchema, ZodCompany } from "./schema";

export async function parseCompanyAsync(company: ZodCompany) {
  return companySchema.parseAsync(company);
}
